/*
    Tweets and Cursors will be marked TimelineTimelineItem
    Threads will be marked TimelineTimelineModule
*/
export enum EntryType {
	TimelineTimelineItem = 'TimelineTimelineItem',
	TimelineTimelineModule = 'TimelineTimelineModule',
}

/*
    Threads of self replies will be marked SelfThread
*/
export enum TweetDisplayType {
	SelfThread = 'SelfThread',
	Tweet = 'Tweet',
}

/*
    This is the base response from the Twitter GraphQL API
*/
export type TwitterGQL = {
	data: {
		threaded_conversation_with_injections_v2: {
			instructions: [TwitterInstruction];
		};
	};
};

export type Entries = {
	content: EntryContent;
};

export type TwitterInstruction = {
	entries: Entries[];
};

export type EntryContent = {
	entryType: EntryType;
	itemContent?: ItemContent;
	items?: Item[];
};

export type Item = {
	item: {
		itemContent: ItemContent;
	};
};

export type ItemContent = {
	tweetDisplayType: TweetDisplayType;
	tweet_results?: {
		result: TweetResult;
	};
};

/*
    TweetResult will house the actual tweet content like its ID, text and author
*/
export type TweetResult = {
	core: {
		user_results: UserResults;
	};
	legacy: TweetLegacy;
	quoted_status_result: {
		result: TweetResult;
	};
	rest_id: string;
};

export type UserResults = {
	result: {
		is_blue_verified: boolean;
		legacy: UserLegacy;
		rest_id: string;
	};
};

export type UserLegacy = {
	name: string;
	profile_image_url_https: string;
	screen_name: string;
};

export type TweetLegacy = {
	entities: Entities;
	full_text: string;
};

export type Entities = {
	media: MediaEntity[];
	urls: UrlEntity[];
};

export type UrlEntity = {
	expanded_url: string;
	indices: [number, number];
};

export type MediaEntity = {
	id_str: string;
	media_key: string;
	type: 'photo' | 'video';
	url: string;
	video_info?: {
		duration_millis: number;
	};
};
