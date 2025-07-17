import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { PostStatsResponseDto } from './dto/post-stats-response.dto';
import { PostStatType } from './dto/increase-post-stats.dto';

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
      ...new Set(
        (postsData as any[]).map((post: any) => post.createdBy.userId),
      ),
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
            stats: {
              views: {
                post: post.postViews,
                phone: post.phoneViews,
                line: post.lineViews,
              },
              shares: 0,
              pins: 0,
            },
            cid: index + 1,
            postNumber: post.id, //Already GG indexed by the old firebase ID in slug, so for old post just keep postNumber as old firebase id
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

  async findOneWithActions(id: string): Promise<any> {
    const post = await this.findOne(id);
    if (!post) {
      return null;
    }

    const postActions = await this.postActionService.findByPostId(id);

    return {
      ...(post as any).toObject(),
      postActions,
    };
  }

  async findOneForOwner(id: string, userId: string): Promise<Post | null> {
    const post = await this.findOne(id);
    if (!post) {
      return null;
    }

    if (post.createdBy.toString() !== userId) {
      throw new ForbiddenException(
        'Access denied. You are not the owner of this post',
      );
    }
    return post;
  }

  async findOneWithActionsForOwner(id: string, userId: string): Promise<any> {
    const post = await this.findOneForOwner(id, userId);
    if (!post) {
      return null;
    }

    const postActions = await this.postActionService.findByPostId(id);

    return {
      ...(post as any).toObject(),
      postActions,
    };
  }

  async findByPostNumber(postNumber: string): Promise<Post | null> {
    return this.postModel
      .findOne({ postNumber })
      .populate('createdBy', 'name profileImg phone line')
      .exec();
  }

  async findByPostNumberAndIncreasePostView(postNumber: string): Promise<Post> {
    const post = await this.postModel
      .findOneAndUpdate(
        { postNumber },
        { $inc: { 'stats.views.post': 1 } },
        {
          new: true,
          populate: { path: 'createdBy', select: 'name profileImg phone line' },
        },
      )
      .exec();

    if (!post) {
      throw new NotFoundException(`Post with number ${postNumber} not found`);
    }

    return post;
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

  async findSimilarPosts(postId: string): Promise<Post[]> {
    const currentPost = await this.postModel.findById(postId).exec();
    if (!currentPost) {
      return [];
    }

    return this.postModel
      .find({
        assetType: currentPost.assetType,
        postType: currentPost.postType,
        status: PostStatus.ACTIVE,
        _id: { $ne: postId },
      })
      .select('_id title thumbnail price postType assetType slug')
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();
  }

  async findByUserId(
    userId: string,
    page: number,
    per_page: number,
  ): Promise<PaginatedResponse<Post>> {
    const baseQuery = () =>
      this.postModel.find({ createdBy: userId }).sort({ createdAt: -1 });

    return paginate(baseQuery, { page, per_page });
  }

  async getUserPostsStats(userId: string): Promise<PostStatsResponseDto> {
    const result = await this.postModel.aggregate([
      { $match: { createdBy: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalPostViews: { $sum: { $ifNull: ['$stats.views.post', 0] } },
          totalPhoneViews: { $sum: { $ifNull: ['$stats.views.phone', 0] } },
          totalLineViews: { $sum: { $ifNull: ['$stats.views.line', 0] } },
          totalShares: { $sum: { $ifNull: ['$stats.shares', 0] } },
          totalPins: { $sum: { $ifNull: ['$stats.pins', 0] } },
        },
      },
    ]);

    const defaultStats = {
      totalPosts: 0,
      totalPostViews: 0,
      totalPhoneViews: 0,
      totalLineViews: 0,
      totalShares: 0,
      totalPins: 0,
    };

    return result[0] || defaultStats;
  }

  async incrementViews(id: string): Promise<Post | null> {
    return this.postModel
      .findByIdAndUpdate(id, { $inc: { 'stats.views.post': 1 } }, { new: true })
      .exec();
  }

  async increasePostStats(id: string, statType: PostStatType): Promise<void> {
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    let updateObject: any = {};

    switch (statType) {
      case PostStatType.SHARES:
        updateObject = { $inc: { 'stats.shares': 1 } };
        break;
      case PostStatType.PINS:
        updateObject = { $inc: { 'stats.pins': 1 } };
        break;
      case PostStatType.PHONE_VIEWS:
        updateObject = { $inc: { 'stats.views.phone': 1 } };
        break;
      case PostStatType.LINE_VIEWS:
        updateObject = { $inc: { 'stats.views.line': 1 } };
        break;
      default:
        throw new Error(`Invalid stat type: ${statType}`);
    }

    await this.postModel.findByIdAndUpdate(id, updateObject).exec();
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
      status: PostStatus.ACTIVE,
      createdAt: new Date(),
      createdBy: userId,
    };

    const createdPost = await new this.postModel(userData).save();

    this.postActionService.create(
      PostActionType.CREATE,
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

    return createdPost;
  }

  async update(
    postId: string,
    updatePostDto: UpdatePostDto,
    userId: string,
  ): Promise<Post> {
    const post = await this.findOneForOwner(postId, userId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const sanitizedTitle = sanitizeHtml(updatePostDto.title, SANITIZE_OPTIONS);
    const sanitizedDesc = sanitizeHtml(updatePostDto.desc, SANITIZE_OPTIONS);

    const updateData = {
      ...updatePostDto,
      title: sanitizedTitle,
      desc: sanitizedDesc,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    const updatedPost = await this.postModel
      .findByIdAndUpdate(postId, updateData, { new: true })
      .exec();

    if (!updatedPost) {
      throw new NotFoundException(`Failed to update post with ID ${postId}`);
    }

    this.postActionService.create(PostActionType.UPDATE, postId, userId);

    return updatedPost;
  }

  async close(postId: string, userId: string): Promise<void> {
    const post = await this.findOneForOwner(postId, userId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const updatedPost = await this.postModel.findByIdAndUpdate(
      postId,
      { status: PostStatus.CLOSED },
      { new: true },
    );

    if (!updatedPost) {
      throw new NotFoundException(`Failed to close post with ID ${postId}`);
    }

    this.postActionService.create(PostActionType.CLOSE, postId, userId);
  }

  async seedTest(post: Post): Promise<Post> {
    const newPost = new this.postModel(post);
    return newPost.save();
  }
}
