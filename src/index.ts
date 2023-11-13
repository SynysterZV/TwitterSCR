import './worker.js';
import { Queue, QueueEvents } from 'bullmq';

const url = 'https://x.com/naval/status/1002103360646823936';

// Top: "1002103360646823936"
// Middle: "1002103559276478464"
// Outside: "1670193155126304768"

const queue = new Queue<{ url: string }>('Twitter');
const events = new QueueEvents('Twitter');

queue.add('job', { url });

events.on('completed', (job) => {
	console.log(job.returnvalue);
});
