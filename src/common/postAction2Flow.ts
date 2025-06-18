import { PostActionType } from '../postActions/postActions.schema';
import { PostStatus } from '../posts/posts.schema';

export interface PostActionFlow {
  action: PostActionType;
  actionLabel: string;
  fromStatus: PostStatus;
  fromSeedStatus: PostStatus; //TODO: Remove later
  toStatus: PostStatus;
  __firebasePostAction:
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
    actionLabel: 'ร่างประกาศ',
    fromStatus: PostStatus.__EMPTY,
    fromSeedStatus: PostStatus.__EMPTY,
    toStatus: PostStatus.DRAFT,
    __firebasePostAction: 'DraftPost',
  },
  {
    action: PostActionType.PUBLISH,
    actionLabel: 'เผยแพร่ประกาศ',
    fromStatus: PostStatus.__CURRENT,
    fromSeedStatus: PostStatus.DRAFT,
    toStatus: PostStatus.ACTIVE,
    __firebasePostAction: 'CreatePost',
  },
  {
    action: PostActionType.UDPATE, // TODO: Can set to __CURRENT from/to later
    actionLabel: 'อัพเดทประกาศ',
    fromStatus: PostStatus.ACTIVE,
    fromSeedStatus: PostStatus.ACTIVE,
    toStatus: PostStatus.ACTIVE,
    __firebasePostAction: 'UpdatePost',
  },
  {
    action: PostActionType.REPORT,
    actionLabel: 'ประกาศถูกรายงาน',
    fromStatus: PostStatus.__CURRENT,
    fromSeedStatus: PostStatus.ACTIVE,
    toStatus: PostStatus.HOLD,
    __firebasePostAction: 'ReportPost',
  },
  {
    action: PostActionType.SELL,
    actionLabel: 'ปิดการขาย',
    fromStatus: PostStatus.__CURRENT,
    fromSeedStatus: PostStatus.ACTIVE,
    toStatus: PostStatus.SOLD,
    __firebasePostAction: 'FulfillPost',
  },
  {
    action: PostActionType.CLOSE,
    actionLabel: 'ปิดประกาศ',
    fromStatus: PostStatus.__CURRENT,
    fromSeedStatus: PostStatus.ACTIVE,
    toStatus: PostStatus.CLOSED,
    __firebasePostAction: 'ClosePost',
  },
];

export { POST_ACTIONS_FLOW };
