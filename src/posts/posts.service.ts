import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument, PostStatus } from './posts.schema';
import * as postsData from './data/posts.json';
import { CreatePostDto } from './dto/createPostDto';
import { User, UserDocument } from '../users/users.schema';
import { genSlug, genUnixEpochTime } from '../common/utils/strings';
import { EnvironmentService } from '../environments/environment.service';
import * as sanitizeHtml from 'sanitize-html';

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
  ___createdAt: FirebaseTimestamp;
  ___updatedAt?: FirebaseTimestamp;
  [key: string]: any;
}

@Injectable()
export class PostsService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private readonly envService: EnvironmentService,
  ) {}

  async onModuleInit() {
    if (this.envService.isTest()) {
      return;
    }

    const count = await this.postModel.estimatedDocumentCount();

    const uniqueFirebaseCreatedByIdsFromPosts = [
      ...new Set(postsData.map((post) => post.createdBy.userId)),
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
            console.error(
              `Pos ID ${post.id} does not contain created by firebase id`,
            );
            return null;
          }
          const mongoUserId = userIdMap[post.createdBy.userId];
          if (!mongoUserId) {
            console.error(
              `User with Firebase ID ${post.createdBy.userId} not found`,
            );
            return null;
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
            priceUnit: post?.priceUnit || undefined,
            landUnit: post?.landUnit || undefined,
            refId: post?.refId || undefined,
            createdAt: new Date(
              post.createdAt.seconds * 1000 +
                post.createdAt.nanoseconds / 1000000,
            ),
            createdBy: mongoUserId,
            updatedAt: undefined,
            updatedBy: undefined,
            ___createdById: post.createdBy.userId,
            ___createdAt: post.createdAt,
            ___updatedAt: undefined,
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
    const postNumber = genUnixEpochTime();
    const userData: any = {
      ...createPostDto,
      desc: sanitizeHtml(createPostDto.desc, {
        allowedTags: ['p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'br'],
      }),
      status: createPostDto.isDraft ? PostStatus.DRAFT : PostStatus.ACTIVE,
      postNumber,
      slug: genSlug(createPostDto.title, postNumber.toString()),
      byMember: !!userId,
      createdAt: new Date(),
      createdBy: userId,
    };
    const createdPost = new this.postModel(userData);
    return createdPost.save();
  }

  async seedTest(post: Post): Promise<Post> {
    const newPost = new this.postModel(post);
    return newPost.save();
  }
}
