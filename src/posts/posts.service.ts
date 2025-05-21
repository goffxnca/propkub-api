import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AssetType,
  Post,
  PostDocument,
  PostStatus,
  PostType,
} from './posts.schema';
import * as postsData from './data/posts.json';
import { CreatePostDto } from './dto/createPostDto';
import { User, UserDocument } from '../users/users.schema';

interface FirebaseTimestamp {
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
  ) {}

  async onModuleInit() {
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

          const convertedPost: PostWithDates = {
            ...post,
            cid: index + 1,
            ___id: post.id,
            createdAt: new Date(
              post.createdAt.seconds * 1000 +
                post.createdAt.nanoseconds / 1000000,
            ),
            createdBy: mongoUserId,
            updatedBy: mongoUserId,
            ___createdById: post.createdBy.userId,
            ___createdAt: post.createdAt,
            updatedAt: new Date(),
            ___updatedAt: post.updatedAt,
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
      .findByIdAndUpdate(id, { $inc: { postViews: 1 } }, { new: true })
      .exec();
  }

  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const userData: any = {
      ...createPostDto,
      desc: 'wefwe', //required
      assetType: AssetType.HOUSE, //required
      postType: PostType.RENT, //required
      cid: 5555, //required
      area: 120, //required
      price: 20, //required
      address: {
        //Paused 12:13, not understand why subfeilds of address marked as required not being validated, (as part of try to build proper post DTO with strict validation)
        provinceId: null, //required
        // provinceLabel: 'Bangkok', //required
        // districtId: '1', //required
        // districtLabel: 'Phra Nakhon', //required
        // subDistrictId: '1', //required
        // subDistrictLabel: 'Phra Borom Maha Ratchawang', //required
        // regionId: '1', //required
        // location: { lat: 13.7563, lng: 100.5018 }, //required
      }, //required
      thumbnail: 'wefwe', //required
      status: PostStatus.ACTIVE, //required
      slug: 'fff', //required
      createdBy: userId, //required
    };
    const createdPost = new this.postModel(userData);
    return createdPost.save();
  }
}
