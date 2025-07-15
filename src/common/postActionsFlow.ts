import { PostActionType } from '../postActions/postActions.schema';
import { PostStatus } from '../posts/posts.schema';

export interface PostActionFlow {
  action: PostActionType;
  fromStatus: PostStatus;
  toStatus: PostStatus;
}

const POST_ACTIONS_FLOW: PostActionFlow[] = [
  {
    action: PostActionType.CREATE,
    fromStatus: PostStatus.EMPTY,
    toStatus: PostStatus.ACTIVE,
  },
  {
    action: PostActionType.UPDATE,
    fromStatus: PostStatus.ACTIVE,
    toStatus: PostStatus.ACTIVE,
  },
  {
    action: PostActionType.SUSPENSE,
    fromStatus: PostStatus.ACTIVE,
    toStatus: PostStatus.HOLD,
  },
  {
    action: PostActionType.RESTORE,
    fromStatus: PostStatus.HOLD,
    toStatus: PostStatus.ACTIVE,
  },
  {
    action: PostActionType.SELL,
    fromStatus: PostStatus.ACTIVE,
    toStatus: PostStatus.SOLD,
  },
  {
    action: PostActionType.CLOSE,
    fromStatus: PostStatus.ACTIVE,
    toStatus: PostStatus.CLOSED,
  },
];

export { POST_ACTIONS_FLOW };
