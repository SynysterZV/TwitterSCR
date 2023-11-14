import { Worker } from 'bullmq';
import { createContent } from '#util/helpers';
import { fetchTweetDetail } from '#util/providers/twitter';

new Worker<{ url: string }>('Twitter', async ({ data }) => {
	const {
		groups: { id },
	} = /https:\/\/(?:twitter|x).com\/\w+\/status\/(?<id>\d+)/.exec(data.url) as { groups: { id?: string } };

	if (!id) return null;

	const tweetDetail = await fetchTweetDetail(id);

	if (!tweetDetail) return null;

	const content = await createContent(tweetDetail, id);

	if (!content) return null;

	return content;
});
