// posts-cron.service.ts
// Synthetic Post Stats Increment Service
// --------------------------------------
// This service is intended to be called by a cron job (e.g., hourly).
// Each run, it:
//   - Randomly selects 1% of all posts (regardless of status)
//   - For each selected post, increments post view by a random amount (1–3)
//   - Randomly selects 1 post from the same selection for phone view (+1)
//   - Randomly selects 1 post from the same selection for line view (+1)
//   - Logs the cids of selected posts (sorted desc) for analysis
//
// Parameters:
//   - PERCENT_PER_RUN: % of posts to increment per run (default: 1%)
//   - INCREMENT_MAX: Range of post view increment per post (default: 1–3)
//   - CronExpression.EVERY_HOUR: Run 24 times / day
//
// Expected result (example):
//   - For 5,000 posts, 1% per run = 50 posts/run
//   - 24 runs/day = Each posts gets +1–3 post view, so 1,200–3,600 synthetic post views/day, distributed randomly
//   - 24 phone views/day and 24 line views/day across posts
//   - Over time, distribution is organic, but newer posts can be weighted for recency bias (future improvement)

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './posts.schema';
import { randomOneToN } from '../common/utils/numbers';
import { randomItem } from '../common/utils/arrays';
import { Cron, CronExpression } from '@nestjs/schedule';

const PERCENT_PER_RUN = 1;
const INCREMENT_MAX = 3;

@Injectable()
export class PostCronService {
  private readonly logger = new Logger(PostCronService.name);

  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async incrementViews() {
    this.logger.log('incrementViews()....');

    try {
      // 1) Pull all posts minimally
      const posts = await this.postModel
        .find({}, { _id: 1, cid: 1, stats: 1 })
        .lean();

      // console.log(
      //   'posts',
      //   JSON.stringify(
      //     posts.map((post) => ({
      //       _id: post._id,
      //       cid: post.cid,
      //       views: post.stats.views.post,
      //     })),
      //   ),
      // );

      const totalPostsToIncrement = Math.max(
        1,
        Math.floor((posts.length * PERCENT_PER_RUN) / 100),
      );

      // 2) Equally randomly pick indexes from 1% of total posts
      const randomSelectedCids = new Set<number>();
      while (randomSelectedCids.size < totalPostsToIncrement) {
        randomSelectedCids.add(randomOneToN(posts.length));
      }

      // 3) Map randomed indexes to actual posts by CID and sort in desc
      const selectedPosts = Array.from(randomSelectedCids)
        .sort((a, b) => a - b)
        .map((idx) => posts.find((post) => post.cid === idx)!);

      this.logger.log(
        `Random ${PERCENT_PER_RUN}% from all ${posts.length} posts: [${selectedPosts.map((post) => post.cid).join(', ')}] (${selectedPosts.length} CIDs)`,
      );

      // 4) Increment each selected post view by a random amount (1–3)
      for (const post of selectedPosts) {
        const increment = randomOneToN(INCREMENT_MAX);

        await this.postModel.updateOne(
          { _id: post._id },
          { $inc: { 'stats.views.post': increment } },
        );

        this.logger.log(
          `Increment ${increment} post views (${post.stats.views.post}->${post.stats.views.post + increment}) for post with CID: ${post.cid}`,
        );
      }

      // 5) Randomly select 1 post for phone view (+1)
      const phoneViewPost = randomItem(selectedPosts);
      await this.postModel.updateOne(
        { _id: phoneViewPost._id },
        { $inc: { 'stats.views.phone': 1 } },
      );
      this.logger.log(
        `Increment 1 phone view (${phoneViewPost.stats.views.phone}->${phoneViewPost.stats.views.phone + 1}) for post with CID: ${phoneViewPost.cid}`,
      );

      // 6) Randomly select 1 post for line view (+1)
      const lineViewPost = randomItem(selectedPosts);
      await this.postModel.updateOne(
        { _id: lineViewPost._id },
        { $inc: { 'stats.views.line': 1 } },
      );
      this.logger.log(
        `Increment 1 line view (${lineViewPost.stats.views.line}->${lineViewPost.stats.views.line + 1}) for post with CID: ${lineViewPost.cid}`,
      );
    } catch (error) {
      this.logger.error('Error occur while running incrementViews()', error);
    }
  }
}
