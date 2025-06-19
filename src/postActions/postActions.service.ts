import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async create(
    postAction: PostActionType,
    postId: string,
    userId: string,
  ): Promise<void> {
    const action = POST_ACTIONS_FLOW.find((paf) => paf.action === postAction);
    if (!action) {
      throw new NotFoundException(`Post action:${postAction} not found`);
    }

    const post = await this.postModel.findById(postId);

    const postActionData: PostActions = {
      type: action.action,
      label: action.actionLabel,
      from:
        action.fromStatus === PostStatus.__CURRENT && post
          ? post.status
          : PostStatus.__EMPTY,
      to:
        action.toStatus === PostStatus.__CURRENT && post
          ? post.status
          : action.toStatus,
      postId: postId,
      createdBy: userId,
      note: '',
    };

    new this.postActionsModel(postActionData).save();
  }
}
