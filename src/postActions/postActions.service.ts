import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EnvironmentService } from '../environments/environment.service';
import {
  PostActions,
  PostActionsDocument,
  PostActionType,
} from './postActions.schema';
import { Post, PostDocument, PostStatus } from '../posts/posts.schema';
import { POST_ACTIONS_FLOW } from '../common/postActionsFlow';

@Injectable()
export class PostActionsService implements OnModuleInit {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
    @InjectModel(PostActions.name)
    private readonly postActionsModel: Model<PostActionsDocument>,

    private readonly envService: EnvironmentService,
  ) {}

  async onModuleInit() {
    if (this.envService.isTest()) {
      return;
    }

    const count = await this.postActionsModel.estimatedDocumentCount();
    if (count === 0) {
      const posts = await this.postModel.find();
      const postActions = posts.map((post) => {
        //NOTE: For now to reduce migration complexity, just seed with 1 post 1 postAction with type 'PUBLISH'
        const postActionsResult: any = {
          type: PostActionType.PUBLISH,
          label: 'เผยแพร่ประกาศ',
          from: PostStatus.DRAFT,
          to: PostStatus.ACTIVE,
          postId: post._id,
          createdAt: post.createdAt,
          createdBy: post.createdBy,
          note: '',
        };
        return postActionsResult;
      });
      await this.postActionsModel.insertMany(postActions);
      console.log(`✅ Seeded ${postActions.length} post actions.`);
    }
  }

  async findByPostId(postId: string): Promise<PostActions[]> {
    return this.postActionsModel
      .find({ postId: new Types.ObjectId(postId) })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Creates a post action entry for audit trail purposes.
   *
   * This system is designed for flexibility rather than strict state machine patterns.
   * Posts can transition between any statuses, making it more like a content management
   * system than a rigid workflow system.
   *
   * @param postAction - The type of action being performed (DRAFT, PUBLISH, UPDATE, CLOSE, etc.)
   * @param postId - The MongoDB ObjectId of the post being acted upon
   * @param userId - The user performing the action
   * @param currentStatus - The post's current status before the action
   *
   * @description The currentStatus parameter resolves PostStatus.__CURRENT placeholders
   * in the POST_ACTIONS_FLOW configuration:
   *
   * Example flows:
   * - UPDATE: fromStatus=__CURRENT, toStatus=__CURRENT
   *   → Both resolved to currentStatus (e.g., ACTIVE → ACTIVE)
   *
   * - CLOSE: fromStatus=__CURRENT, toStatus=CLOSED
   *   → from=currentStatus, to=CLOSED (e.g., ACTIVE → CLOSED)
   *
   * - DRAFT: fromStatus=__EMPTY, toStatus=DRAFT
   *   → from=__EMPTY, to=DRAFT (currentStatus not used)
   *
   * This design allows any post status to perform UPDATE actions while maintaining
   * proper audit trails of what actually happened.
   */
  async create(
    postAction: PostActionType,
    postId: string,
    userId: string,
    currentStatus: PostStatus,
  ): Promise<void> {
    const action = POST_ACTIONS_FLOW.find((paf) => paf.action === postAction);
    if (!action) {
      throw new NotFoundException(`Post action:${postAction} not found`);
    }

    const postActionData: PostActions = {
      type: action.action,
      from:
        action.fromStatus === PostStatus.__CURRENT
          ? currentStatus
          : action.fromStatus,
      to:
        action.toStatus === PostStatus.__CURRENT
          ? currentStatus
          : action.toStatus,
      postId: postId,
      createdBy: userId,
      note: '',
    };

    new this.postActionsModel(postActionData).save();
  }
}
