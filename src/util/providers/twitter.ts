import { randomUUID } from 'node:crypto';
import { BASE_HEADERS, GUEST_BEARER_TOKEN, TWITTER_API_ROOT, TWITTER_ROOT } from '#util/constants';
import { generateSnowflake, getRandomAccount } from '#util/helpers';
import type { TwitterGQL } from '#util/types/API';
import { generateUserAgent } from '#util/userAgent';

const API_ATTEMPTS = 3;

export async function twitterFetch(url: string, useAuth: boolean = false): Promise<TwitterGQL | null> {
	let apiAttempts = 0;

	const [userAgent, secChUa] = generateUserAgent();
	// console.log(`Outgoing useragent for this request: ${userAgent}`)

	const tokenHeaders: Record<string, string> = {
		Authorization: GUEST_BEARER_TOKEN,
		'User-Agent': userAgent,
		'sec-ch-ua': secChUa,
		...BASE_HEADERS,
	};

	const guestTokenRequest = new Request(`${TWITTER_API_ROOT}/1.1/guest/activate.json`, {
		method: 'POST',
		headers: tokenHeaders,
		body: '',
	});

	while (apiAttempts < API_ATTEMPTS) {
		const account = getRandomAccount();

		const csrfToken = useAuth ? account.csrfToken : randomUUID().replaceAll('-', '');

		const headers: Record<string, string> = {
			Authorization: GUEST_BEARER_TOKEN,
			...BASE_HEADERS,
		};

		apiAttempts++;

		let activate: Response | null = null;
		let activateJson: { guest_token: string } = { guest_token: '' };

		if (!useAuth) {
			activate = await fetch(guestTokenRequest.clone());

			if (!activate.ok) {
				continue;
			}

			try {
				activateJson = (await activate.json()) as { guest_token: string };
			} catch {
				continue;
			}
		}

		const guestToken = useAuth ? generateSnowflake() : activateJson.guest_token;

		// console.log(`Guest Token: ${guestToken}`)

		headers.Cookie = [
			`guest_id_ads=v1%3A${guestToken}`,
			`guest_id_marketing=v1%3A${guestToken}`,
			`guest_id=v1%3A${guestToken}`,
			`ct0=${csrfToken}; ${useAuth ? `auth_token=${account.authToken}` : ''}`,
		].join('; ');

		headers['x-csrf-token'] = csrfToken;
		headers['x-twitter-active-user'] = 'yes';
		headers['x-guest-token'] = guestToken;

		const res = await fetch(url, {
			method: 'GET',
			headers,
		}).catch((error) => {
			throw new Error(error);
		});

		if (!res.ok) {
			throw new Error(`Request Error: ${res.statusText}`);
		}

		return res.json();
	}

	return null;
}

export async function fetchTweetDetail(status: string) {
	const url = `${TWITTER_ROOT}/i/api/graphql/7xdlmKfKUJQP7D7woCL5CA/TweetDetail?variables=${encodeURIComponent(
		JSON.stringify({
			focalTweetId: status,
			referrer: 'home',
			with_rux_injections: false,
			includePromotedContent: false,
			withCommunity: false,
			withBirdwatchNotes: false,
			withQuickPromoteEligibilityTweetFields: false,
			withVoice: false,
			withV2Timeline: true,
		}),
	)}&features=${encodeURIComponent(
		JSON.stringify({
			c9s_tweet_anatomy_moderator_badge_enabled: false,
			responsive_web_graphql_exclude_directive_enabled: false,
			verified_phone_label_enabled: false,
			responsive_web_home_pinned_timelines_enabled: false,
			creator_subscriptions_tweet_preview_api_enabled: false,
			responsive_web_graphql_timeline_navigation_enabled: true,
			responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
			tweetypie_unmention_optimization_enabled: true,
			responsive_web_edit_tweet_api_enabled: true,
			graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
			view_counts_everywhere_api_enabled: true,
			longform_notetweets_consumption_enabled: true,
			responsive_web_twitter_article_tweet_consumption_enabled: false,
			tweet_awards_web_tipping_enabled: false,
			freedom_of_speech_not_reach_fetch_enabled: true,
			standardized_nudges_misinfo: false,
			tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
			longform_notetweets_rich_text_read_enabled: true,
			longform_notetweets_inline_media_enabled: true,
			responsive_web_media_download_video_enabled: true,
			responsive_web_enhance_cards_enabled: true,
		}),
	)}&fieldToggles=${encodeURIComponent(
		JSON.stringify({
			withArticleRichContentState: true,
		}),
	)}`;

	return twitterFetch(url, true);
}

export async function fetchByRestId(status: string) {
	return twitterFetch(
		`${TWITTER_ROOT}/i/api/graphql/2ICDjqPd81tulZcYrtpTuQ/TweetResultByRestId?variables=${encodeURIComponent(
			JSON.stringify({
				tweetId: status,
				withCommunity: false,
				includePromotedContent: false,
				withVoice: false,
			}),
		)}&features=${encodeURIComponent(
			JSON.stringify({
				creator_subscriptions_tweet_preview_api_enabled: true,
				tweetypie_unmention_optimization_enabled: true,
				responsive_web_edit_tweet_api_enabled: true,
				graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
				view_counts_everywhere_api_enabled: true,
				longform_notetweets_consumption_enabled: true,
				responsive_web_twitter_article_tweet_consumption_enabled: false,
				tweet_awards_web_tipping_enabled: false,
				freedom_of_speech_not_reach_fetch_enabled: true,
				standardized_nudges_misinfo: true,
				tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
				longform_notetweets_rich_text_read_enabled: true,
				longform_notetweets_inline_media_enabled: true,
				responsive_web_graphql_exclude_directive_enabled: true,
				verified_phone_label_enabled: false,
				responsive_web_media_download_video_enabled: false,
				responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
				responsive_web_graphql_timeline_navigation_enabled: true,
				responsive_web_enhance_cards_enabled: false,
			}),
		)}&fieldToggles=${encodeURIComponent(
			JSON.stringify({
				withArticleRichContentState: true,
			}),
		)}`,
	);
}
