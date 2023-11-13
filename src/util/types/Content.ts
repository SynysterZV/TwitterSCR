export enum ContentType {
	TweetThread = 'tweetThread',
	Tweets = 'tweets',
	TwitterUser = 'twitterUser',
}

type TwitterContent<T = ContentType, D = Record<string, unknown>> = {
	contentType: T;
	data: D;
	id: string;
	innerId: string;
};

export type TwitterUserContent = TwitterContent<
	ContentType.TwitterUser,
	{
		name: string;
		profilePicUrl: string | null;
		username: string;
		verified: boolean;
	}
>;

export type TweetThreadContent = TwitterContent<
	ContentType.TweetThread,
	{
		firstTweetMedia: ReaderTweetMedia[];
		firstTweetText: string | null;
		mainTweetId: string;
		readingTimeMinutes: number;
		threadCount: number;
	}
> & {
	ownerContentId: string;
};

export type TweetsContent = TwitterContent<
	ContentType.Tweets,
	{
		chunks: ReaderTweetChunk[];
	}
> & {
	ownerContentId: string;
	referencedContent: ContentReference[];
};

export type ReaderTweetMedia = {
	id?: string;
	imageUrl?: string;
	mediaKey?: string;
	type: string;
	videoDurationMs?: number;
	videoUrl?: string;
};

export type ReaderTweetChunk = {
	createdAt: number;
	id: string;
	links?: ChunkLink[];
	media: ReaderTweetMedia[];
	quotingTweet?: ReaderTweetChunk;
	textContent: string | null;
	twitterUserId: string;
	type: 'tweet';
};

export type ContentReference = {
	contentId: string;
	contentType: ContentType;
};

export type ChunkLink = {
	endIndex: number;
	href: string;
	startIndex: number;
};
