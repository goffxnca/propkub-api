import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './posts.schema';
import * as postsData from "./data/posts.json"

interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

interface PostWithFirebaseTimestamps {
  createdAt: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
  [key: string]: any;
}

interface PostWithDates {
  createdAt: Date;
  updatedAt?: Date;
  __createdAt: FirebaseTimestamp;
  __updatedAt?: FirebaseTimestamp;
  [key: string]: any;
}

@Injectable()
export class PostsService implements OnModuleInit {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>
  ) {}

  async onModuleInit() {
    const count = await this.postModel.estimatedDocumentCount();
    if (count === 0) {
      const convertedPosts = (postsData as PostWithFirebaseTimestamps[]).map(post => {
        const convertedPost: PostWithDates = {
          ...post,
          createdAt: new Date(post.createdAt.seconds * 1000 + post.createdAt.nanoseconds / 1000000),
          __createdAt: post.createdAt,
        } as PostWithDates;

        if (post.updatedAt) {
          convertedPost.updatedAt = new Date(post.updatedAt.seconds * 1000 + post.updatedAt.nanoseconds / 1000000);
          convertedPost.__updatedAt = post.updatedAt;
        }

        return convertedPost;
      });

      await this.postModel.insertMany(convertedPosts);
      console.log(`✅ Seeded ${convertedPosts.length} posts.`);
    }
  }

  async findAll(limit: number, offset: number): Promise<Post[]> {
    return this.postModel.find()
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<Post | null> {
    return this.postModel.findOne({ id }).exec();
  }

  async findByProvinceId(provinceId: string): Promise<Post[]> {
    return this.postModel.find({ 'address.provinceId': provinceId }).exec();
  }

  async findByDistrictId(districtId: string): Promise<Post[]> {
    return this.postModel.find({ 'address.districtId': districtId }).exec();
  }

  async findBySubDistrictId(subDistrictId: string): Promise<Post[]> {
    return this.postModel.find({ 'address.subDistrictId': subDistrictId }).exec();
  }

  async findByAssetType(assetType: string): Promise<Post[]> {
    return this.postModel.find({ assetType }).exec();
  }

  async findByPostType(postType: string): Promise<Post[]> {
    return this.postModel.find({ postType }).exec();
  }

  async incrementViews(id: string): Promise<Post | null> {
    return this.postModel.findOneAndUpdate(
      { id },
      { $inc: { postViews: 1 } },
      { new: true }
    ).exec();
  }
} 