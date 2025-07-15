import { PostActionType } from '../postActions/postActions.schema';
import { PostStatus } from '../posts/posts.schema';

export interface PostActionFlow {
  action: PostActionType;
  fromStatus: PostStatus;
  fromSeedStatus: PostStatus; //TODO: Remove later after seeded
  toStatus: PostStatus;
  __firebasePostAction: //TODO: Remove later after seeded
  | 'DraftPost'
    | 'CreatePost'
    | 'UpdatePost'
    | 'ReportPost'
    | 'FulfillPost'
    | 'ClosePost';
}

const POST_ACTIONS_FLOW: PostActionFlow[] = [
  {
    action: PostActionType.DRAFT, //OK
    fromStatus: PostStatus.__EMPTY,
    fromSeedStatus: PostStatus.__EMPTY,
    toStatus: PostStatus.DRAFT,
    __firebasePostAction: 'DraftPost',
  },
  {
    action: PostActionType.PUBLISH,
    fromStatus: PostStatus.__CURRENT,
    fromSeedStatus: PostStatus.__EMPTY,
    toStatus: PostStatus.ACTIVE,
    __firebasePostAction: 'CreatePost',
  },
  {
    action: PostActionType.UPDATE,
    fromStatus: PostStatus.__CURRENT,
    fromSeedStatus: PostStatus.ACTIVE,
    toStatus: PostStatus.__CURRENT,
    __firebasePostAction: 'UpdatePost',
  },
  {
    action: PostActionType.REPORT,
    fromStatus: PostStatus.__CURRENT,
    fromSeedStatus: PostStatus.ACTIVE,
    toStatus: PostStatus.HOLD,
    __firebasePostAction: 'ReportPost',
  },
  {
    action: PostActionType.SELL,
    fromStatus: PostStatus.__CURRENT,
    fromSeedStatus: PostStatus.ACTIVE,
    toStatus: PostStatus.SOLD,
    __firebasePostAction: 'FulfillPost',
  },
  {
    action: PostActionType.CLOSE,
    fromStatus: PostStatus.__CURRENT,
    fromSeedStatus: PostStatus.ACTIVE,
    toStatus: PostStatus.CLOSED,
    __firebasePostAction: 'ClosePost',
  },
];

export { POST_ACTIONS_FLOW };
