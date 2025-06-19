import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument, PostStatus } from './posts.schema';
import * as postsData from './data/posts.json';
import { CreatePostDto } from './dto/createPostDto';
import { User, UserDocument } from '../users/users.schema';
import { genSlug, genUnixEpochTime } from '../common/utils/strings';
import { EnvironmentService } from '../environments/environment.service';
import * as sanitizeHtml from 'sanitize-html';
import { UpdatePostDto } from './dto/updatePostDto';
import { MailService } from '../mail/mail.service';
import { EMAIL_POST_CREATED, NO_REPLY_EMAIL } from '../common/constants';
import { UsersService } from '../users/users.service';
import { PostActionsService } from '../postActions/postActions.service';
import { PostActionType } from '../postActions/postActions.schema';

interface FirebaseTimestamp {
  //TODO: Remove later once it seems to created correctly
  seconds: number;
  nanoseconds: number;
}

interface PostWithFirebaseTimestamps {
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  [key: string]: any;
}

interface PostWithDates {
  createdAt: Date;
  updatedAt?: Date;
  [key: string]: any;
}

@Injectable()
export class PostsService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private readonly envService: EnvironmentService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly postActionService: PostActionsService,
  ) {}

  async onModuleInit() {
    if (this.envService.isTest()) {
      return;
    }
    const count = await this.postModel.estimatedDocumentCount();
    const uniqueFirebaseCreatedByIdsFromPosts = [
      ...new Set(postsData.map((post: any) => post.createdBy.userId)),
    ];
    // console.log(
    //   'uniqueFirebaseCreatedByIdsFromPosts',
    //   uniqueFirebaseCreatedByIdsFromPosts,
    // );
    const allUsersMatchedPostsCreatedBy = await this.userModel
      .find({
        ___id: { $in: uniqueFirebaseCreatedByIdsFromPosts },
      })
      .lean();
    // console.log('allUsersMatchedPostsCreatedBy', allUsersMatchedPostsCreatedBy);
    const userIdMap = {};
    allUsersMatchedPostsCreatedBy.forEach((user) => {
      userIdMap[user.___id!] = user._id;
    });
    console.log('userIdMap', userIdMap);
    if (count === 0) {
      const convertedPosts = (postsData as PostWithFirebaseTimestamps[]).map(
        (post, index) => {
          const createdByFirebaseUserId = post.createdBy.userId;
          if (!createdByFirebaseUserId) {
            throw new Error(
              `Pos ID ${post.id} does not contain created by firebase id`,
            );
          }
          const mongoUserId = userIdMap[createdByFirebaseUserId];
          if (!mongoUserId) {
            throw new Error(
              `User with Firebase ID ${createdByFirebaseUserId} not found`,
            );
          }
          const postStatus = post.subStatus;
          const convertedPost: PostWithDates = {
            ...post,
            cid: index + 1,
            status:
              postStatus === 'fulfilled'
                ? PostStatus.SOLD
                : postStatus === 'expired' || postStatus === 'closed'
                  ? PostStatus.CLOSED
                  : PostStatus.ACTIVE,
            isStudio: post?.isStudio || false,
            byMember: true,
            views: {
              post: post.postViews,
              phone: post.phoneViews,
              line: post.lineViews,
            },
            postNumber: post.id,
            video: post?.video || undefined,
            landUnit: post?.landUnit || undefined,
            areaUnit: post?.areaUnit || undefined,
            priceUnit: post?.priceUnit || undefined,
            condition: post?.condition || undefined,
            refId: post?.refId || undefined,
            createdAt: new Date(
              post.createdAt.seconds * 1000 +
                post.createdAt.nanoseconds / 1000000,
            ),
            createdBy: mongoUserId,
            updatedAt: undefined,
            updatedBy: undefined,
            ___createdById: post.createdBy.userId,
            ___id: post.id,
          };
          return convertedPost;
        },
      );
      await this.postModel.insertMany(convertedPosts);
      console.log(`✅ Seeded ${convertedPosts.length} posts.`);
    }
  }

  async findAll(limit: number, offset: number): Promise<Post[]> {
    return this.postModel.find().skip(offset).limit(limit).exec();
  }

  async findOne(id: string): Promise<Post | null> {
    return this.postModel.findById(id).exec();
  }

  async findByProvinceId(provinceId: string): Promise<Post[]> {
    return this.postModel.find({ 'address.provinceId': provinceId }).exec();
  }

  async findByDistrictId(districtId: string): Promise<Post[]> {
    return this.postModel.find({ 'address.districtId': districtId }).exec();
  }

  async findBySubDistrictId(subDistrictId: string): Promise<Post[]> {
    return this.postModel
      .find({ 'address.subDistrictId': subDistrictId })
      .exec();
  }

  async findByAssetType(assetType: string): Promise<Post[]> {
    return this.postModel.find({ assetType }).exec();
  }

  async findByPostType(postType: string): Promise<Post[]> {
    return this.postModel.find({ postType }).exec();
  }

  async incrementViews(id: string): Promise<Post | null> {
    return this.postModel
      .findByIdAndUpdate(id, { $inc: { 'views.post': 1 } }, { new: true })
      .exec();
  }

  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException();
    }

    const postNumber = genUnixEpochTime();
    const userData = {
      ...createPostDto,
      desc: sanitizeHtml(createPostDto.desc, {
        allowedTags: ['p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'br'],
      }),
      status: createPostDto.isDraft ? PostStatus.DRAFT : PostStatus.ACTIVE,
      postNumber: postNumber,
      slug: genSlug(createPostDto.title, postNumber.toString()),
      byMember: !!userId,
      createdAt: new Date(),
      createdBy: userId,
    };
    const createdPost = new this.postModel(userData);

    this.postActionService.create(
      createPostDto.isDraft ? PostActionType.DRAFT : PostActionType.PUBLISH,
      createdPost.id,
      userId,
    );

    this.mailService.sendEmail({
      from: NO_REPLY_EMAIL,
      to: user.email,
      templateId: EMAIL_POST_CREATED,
      templateData: {
        recipientName: user.name,
        postUrl: `https://propkub.com/property/${createdPost.slug}`,
        postNumber: createdPost.postNumber,
        postTitle: createdPost.title,
      },
    });

    return createdPost.save();
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    userId: string,
  ): Promise<Post | null> {
    const post = await this.postModel.findById(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    const updateData = {
      ...updatePostDto,
      desc: updatePostDto.desc
        ? sanitizeHtml(updatePostDto.desc, {
            allowedTags: ['p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'br'],
          })
        : undefined,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    const updatedPost = this.postModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    this.postActionService.create(PostActionType.UDPATE, id, userId);

    return updatedPost;
  }

  async seedTest(post: Post): Promise<Post> {
    const newPost = new this.postModel(post);
    return newPost.save();
  }
}
