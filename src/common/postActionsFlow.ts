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
    fromStatus: PostStatus.__EMPTY,
    toStatus: PostStatus.ACTIVE,
  },
  {
    action: PostActionType.UPDATE,
    fromStatus: PostStatus.__CURRENT,
    toStatus: PostStatus.__CURRENT,
  },
  {
    action: PostActionType.REPORT,
    fromStatus: PostStatus.__CURRENT,
    toStatus: PostStatus.HOLD,
  },
  {
    action: PostActionType.RESTORE,
    fromStatus: PostStatus.HOLD,
    toStatus: PostStatus.ACTIVE,
  },
  {
    action: PostActionType.SELL,
    fromStatus: PostStatus.__CURRENT,
    toStatus: PostStatus.SOLD,
  },
  {
    action: PostActionType.CLOSE,
    fromStatus: PostStatus.__CURRENT,
    toStatus: PostStatus.CLOSED,
  },
];

export { POST_ACTIONS_FLOW };
