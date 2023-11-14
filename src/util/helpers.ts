import { randomUUID } from 'node:crypto';
import { EntryType, TweetDisplayType } from '#util/types/API';
import type { ItemContent, TweetResult, TwitterGQL } from '#util/types/API';
import { ContentType } from '#util/types/Content';
import type {
	ReaderTweetChunk,
	ReaderTweetMedia,
	TweetThreadContent,
	TweetsContent,
	TwitterUserContent,
} from '#util/types/Content';
import type { AugmentedRequired } from '#util/types/Utility';
import credentials from '../credentials.json' assert { type: 'json' };

type ItemContentR = AugmentedRequired<ItemContent, 'tweet_results'>;

export function getTimestampFromId(tid: string) {
	const offset = 1_288_834_974_657;
	return (Number(tid) >> 22) + offset;
}

export const generateSnowflake = () => {
	const epoch = 1_288_834_974_657n; /* Twitter snowflake epoch */
	const timestamp = BigInt(Date.now()) - epoch;
	return String((timestamp << 22n) | BigInt(Math.floor(Math.random() * 696_969)));
};

export function getRandomAccount() {
	return credentials.accounts[Math.floor(Math.random() * credentials.accounts.length)];
}

export function createContent(
	data: TwitterGQL,
	mainTweetId: string,
): [TweetsContent, TweetThreadContent, ...TwitterUserContent[]] | null {
	const { entries } = data.data.threaded_conversation_with_injections_v2.instructions[0];

	if (!entries) return null;

	const tweets: ItemContentR[] = [];

	for (const entry of entries) {
		const entryType = entry.content.entryType;

		switch (entryType) {
			case EntryType.TimelineTimelineItem:
				if (entry.content.itemContent && 'tweet_results' in entry.content.itemContent) {
					tweets.push(entry.content.itemContent as ItemContentR);
				}

				break;

			case EntryType.TimelineTimelineModule:
				if (entry.content.items) {
					for (const item of entry.content.items) {
						if ('tweet_results' in item.item.itemContent) {
							tweets.push(item.item.itemContent as ItemContentR);
						}
					}
				}

				break;
		}
	}

	const firstTweet = tweets[0].tweet_results.result;
	const lastTweet = tweets[tweets.length - 1].tweet_results.result;

	const isSelfThread = tweets[0].tweetDisplayType === TweetDisplayType.SelfThread;

	const uniqueUsers = new Map<string, TwitterUserContent>();

	for (const x of tweets) {
		const {
			rest_id,
			is_blue_verified,
			legacy: { name, screen_name, profile_image_url_https },
		} = x.tweet_results.result.core.user_results.result;

		uniqueUsers.set(rest_id, {
			id: randomUUID(),
			contentType: ContentType.TwitterUser,
			innerId: `twitter-user-${rest_id}`,
			data: {
				username: screen_name,
				name,
				verified: is_blue_verified,
				profilePicUrl: profile_image_url_https,
			},
		} satisfies TwitterUserContent);
	}

	const users = Array.from(uniqueUsers.values());

	const tweetC = {
		id: randomUUID(),
		contentType: ContentType.Tweets,
		innerId:
			tweets[0].tweetDisplayType === TweetDisplayType.SelfThread
				? `tweets-${firstTweet.rest_id}`
				: `tweets-${firstTweet.rest_id}-${lastTweet.rest_id}`,
		ownerContentId: firstTweet.rest_id,
		data: {
			chunks: tweets.map((x) => createTweetChunk(x.tweet_results.result)),
		},
		referencedContent: users.map((x) => ({
			contentType: x.contentType,
			contentId: x.id,
		})),
	} satisfies TweetsContent;

	const tweetT = {
		id: randomUUID(),
		contentType: ContentType.TweetThread,
		innerId: isSelfThread ? `tweetThread-${firstTweet.rest_id}` : `tweets-${firstTweet.rest_id}-${lastTweet.rest_id}`,
		ownerContentId: firstTweet.core.user_results.result.rest_id,
		data: {
			firstTweetText: firstTweet.legacy.full_text,
			firstTweetMedia: createTweetMedia(firstTweet),
			threadCount: tweets.length,
			readingTimeMinutes:
				tweets.reduce((a, c) => a + c.tweet_results.result.legacy.full_text.split(' ').length, 0) / 200,
			mainTweetId,
		},
	} satisfies TweetThreadContent;

	return [tweetC, tweetT, ...users];
}

export function createTweetChunk(tweet: TweetResult): ReaderTweetChunk {
	return {
		id: tweet.rest_id,
		type: 'tweet',
		createdAt: getTimestampFromId(tweet.rest_id),
		twitterUserId: tweet.core.user_results.result.rest_id,
		textContent: tweet.legacy.full_text,
		quotingTweet: tweet.quoted_status_result ? createTweetChunk(tweet.quoted_status_result.result) : undefined,
		links: tweet.legacy.entities.urls.map((x) => ({
			href: x.expanded_url,
			startIndex: x.indices[0],
			endIndex: x.indices[1],
		})),
		media: createTweetMedia(tweet),
	};
}

export function createTweetMedia(tweet: TweetResult): ReaderTweetMedia[] {
	return (
		tweet.legacy.entities.media?.map((x) => ({
			id: x.id_str,
			mediaKey: x.media_key,
			type: x.type,
			imageUrl: x.type === 'photo' ? x.url : undefined,
			videoUrl: x.type === 'video' ? x.url : undefined,
			videoDurationMs: x.type === 'video' ? x.video_info?.duration_millis : undefined,
		})) || []
	);
}
