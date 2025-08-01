// synthetic-cron.service.ts
// Synthetic Post Views Increment Service
// --------------------------------------
// This service is intended to be called by a cron job (e.g., hourly).
// Each run, it:
//   - Randomly selects 1% of all posts (regardless of status)
//   - For each selected post, increments stats.views.post by a random amount (1–3)
//   - Logs the cids of selected posts (sorted desc) for analysis
//
// Parameters:
//   - PERCENT_PER_RUN: % of posts to increment per run (default: 1%)
//   - INCREMENT_MAX: Range of increment per post (default: 1–3)
//   - RUNS_PER_DAY: How many times per day the cron runs (default: 24)
//
// Expected result (example):
//   - For 5,000 posts, 1% per run = 50 posts/run
//   - 24 runs/day = 1,200 posts incremented/day
//   - Each gets +1–3, so 1,200–3,600 synthetic views/day, distributed randomly
//   - Over time, distribution is organic, but newer posts can be weighted for recency bias

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './posts.schema';
import { randomOneToN } from '../common/utils/numbers';
import { Cron, CronExpression } from '@nestjs/schedule';

const PERCENT_PER_RUN = 1;
const INCREMENT_MAX = 3;

@Injectable()
export class SyntheticCronService {
  private readonly logger = new Logger(SyntheticCronService.name);

  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async incrementSyntheticViews() {
    this.logger.log('incrementSyntheticViews()....');

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
        .map((idx) => posts.find((post) => post.cid === idx)!)
        .sort((a, b) => b.cid - a.cid);

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
          `Increment ${increment} views (${post.stats.views.post}->${post.stats.views.post + increment}) for post with CID: ${post.cid}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Error occur while running incrementSyntheticViews()',
        error,
      );
    }
  }
}
