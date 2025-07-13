import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument, PostStatus } from './posts.schema';
import * as postsData from './data/posts.json';
import { CreatePostDto } from './dto/createPostDto';
import { User, UserDocument } from '../users/users.schema';
import { genSlug } from '../common/utils/strings';
import { EnvironmentService } from '../environments/environment.service';
import * as sanitizeHtml from 'sanitize-html';
import { UpdatePostDto } from './dto/updatePostDto';
import { MailService } from '../mail/mail.service';
import { EMAIL_POST_CREATED, NO_REPLY_EMAIL } from '../common/constants';
import { UsersService } from '../users/users.service';
import { PostActionsService } from '../postActions/postActions.service';
import { PostActionType } from '../postActions/postActions.schema';
import { paginate, PaginatedResponse } from '../common/utils/pagination';

const SANITIZE_OPTIONS = {
  allowedTags: ['p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'br', 'a'],
};
//p -> paragraph
//em -> italic
//strong -> bold
//u -> underline
//ol, li -> ordered list
//ul, li -> unordered list
//br -> new line
//a -> link

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
            status:
              postStatus === 'fulfilled'
                ? PostStatus.SOLD
                : postStatus === 'expired' || postStatus === 'closed'
                  ? PostStatus.CLOSED
                  : PostStatus.ACTIVE,
            byMember: true,
            views: {
              post: post.postViews,
              phone: post.phoneViews,
              line: post.lineViews,
            },
            cid: index + 1,
            postNumber: post.id,
            isStudio: post?.isStudio || undefined,
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
            ___id: post.id,
            ___createdById: post.createdBy.userId,
          };
          return convertedPost;
        },
      );
      await this.postModel.insertMany(convertedPosts);
      console.log(`✅ Seeded ${convertedPosts.length} posts.`);
    }
  }

  async findAll(
    page: number,
    per_page: number,
  ): Promise<PaginatedResponse<Post>> {
    const baseQuery = () => this.postModel.find().sort({ createdAt: -1 });
    return paginate<Post>(baseQuery, { page, per_page });
  }

  async findOne(id: string): Promise<Post | null> {
    return this.postModel.findById(id).exec();
  }

  async findByPostNumber(postNumber: string): Promise<Post | null> {
    return this.postModel.findOne({ postNumber }).exec();
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

  async findByUserId(
    userId: string,
    page: number,
    per_page: number,
  ): Promise<PaginatedResponse<Post>> {
    const baseQuery = () =>
      this.postModel.find({ createdBy: userId }).sort({ createdAt: -1 });
    return paginate<Post>(baseQuery, { page, per_page });
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

    const existingPost = await this.findByPostNumber(createPostDto.postNumber);
    if (existingPost) {
      throw new ConflictException(
        `Post with postNumber ${createPostDto.postNumber} already exists.`,
      );
    }

    // Always sanitize title/desc on backend for security
    // Frontend (ReactQuill) already escapes HTML by default for "desc", but we sanitize here to protect against:
    // - Direct API calls from Postman/curl/mobile apps
    // - Bypassing frontend validation
    // - Future frontend changes that might remove escaping
    const sanitizedTitle = sanitizeHtml(createPostDto.title, SANITIZE_OPTIONS);
    const sanitizedDesc = sanitizeHtml(createPostDto.desc, SANITIZE_OPTIONS);

    const userData = {
      ...createPostDto,
      title: sanitizedTitle,
      slug: genSlug(sanitizedTitle, createPostDto.postNumber),
      desc: sanitizedDesc,
      status: createPostDto.isDraft ? PostStatus.DRAFT : PostStatus.ACTIVE,
      byMember: !!userId,
      createdAt: new Date(),
      createdBy: userId,
    };
    const createdPost = new this.postModel(userData);
    const savedPost = await createdPost.save();

    await this.postActionService.create(
      createPostDto.isDraft ? PostActionType.DRAFT : PostActionType.PUBLISH,
      savedPost.id,
      userId,
    );

    this.mailService.sendEmail({
      from: NO_REPLY_EMAIL,
      to: user.email,
      templateId: EMAIL_POST_CREATED,
      templateData: {
        recipientName: user.name,
        postUrl: `https://propkub.com/property/${savedPost.slug}`,
        postNumber: savedPost.postNumber,
        postTitle: savedPost.title,
      },
    });

    return savedPost;
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
