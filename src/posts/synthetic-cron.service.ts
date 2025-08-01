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

const PERCENT_PER_RUN = 0.01;
const INCREMENT_MAX = 3;

@Injectable()
export class SyntheticCronService {
  private readonly logger = new Logger(SyntheticCronService.name);

  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async incrementSyntheticViews() {
    this.logger.log('incrementSyntheticViews....');

    try {
      const posts = await this.postModel
        .find({}, { _id: 1, cid: 1, stats: 1 })
        .lean();

      console.log(
        'posts',
        posts.map((post) => ({
          _id: post._id,
          cid: post.cid,
          views: post.stats.views.post,
        })),
      );
      const totalPostsToIncrement = Math.max(
        1,
        Math.floor(posts.length * PERCENT_PER_RUN),
      );
      // Optionally, add recency bias by weighting cids
      // For now, uniform random selection
      const randomSelectedCids = new Set<number>();
      while (randomSelectedCids.size < totalPostsToIncrement) {
        randomSelectedCids.add(randomOneToN(posts.length));
      }

      console.log('randomSelectedCids', randomSelectedCids);
      const selectedPosts = Array.from(randomSelectedCids)
        .sort((a, b) => b - a)
        .map((idx) => posts.find((post) => post.cid === idx)!);

      // Log the selected cids for analysis
      this.logger.log(
        `Synthetic increment: selected ${selectedPosts.length} posts (cids): [${selectedPosts.map((post) => post?.cid).join(', ')}]`,
      );

      // Increment each selected post by a random amount (1–3)
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
      console.log('Error occur while incrementing synthertic views', error);
    }
  }
}
