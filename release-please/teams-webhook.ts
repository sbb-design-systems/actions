const repo = process.env.GITHUB_REPOSITORY;
const version = process.env.VERSION!.replace(/^v/, '');
const response = await fetch(`https://api.github.com/repos/${repo}/releases/tags/v${version}`);
if (!response.ok) {
  throw new Error(`Failed to fetch release info: ${response.status} ${response.statusText}`);
}
const release = (await response.json()) as GitHubResponse;

const responseRepo = await fetch(`https://api.github.com/repos/${repo}`);
if (!response.ok) {
  throw new Error(`Failed to fetch repo info: ${response.status} ${response.statusText}`);
}
const repoInfo = (await responseRepo.json()) as GitHubResponse;

if (!repoInfo.homepage) {
  throw new Error(`Failed to find field homepage in repo information`);
}

const majorVersion = version.split('.')[0];
const isNext = version.includes('next') || version.includes('rc');

let docsUrl = repoInfo.homepage;
const hostPrefix = new URL(repoInfo.homepage).host.split('.')[0];
if (isNext) {
  try {
    const nextCandidate = repoInfo.homepage.replace(hostPrefix, `${hostPrefix}-next`);
    await fetch(nextCandidate);
    docsUrl = nextCandidate;
  } catch {
    // Do nothing, next deployment maybe not configured.
  }
} else {
  try {
    const majorCandidate = repoInfo.homepage.replace(hostPrefix, `${hostPrefix}-v${majorVersion}`);
    await fetch(majorCandidate);
    docsUrl = majorCandidate;
  } catch {
    // Do nothing, release was on current major version.
  }
}
const ucFirst = (value: string) => value.replace(/^\w/, (m) => m.toUpperCase());
const teamsResponse = await fetch(process.env.TEAMS_WEBHOOK!, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.5',
          msteams: { width: 'full' },
          body: [
            {
              type: 'TextBlock',
              text: `🎉 ${repoInfo.name.split('-').map(ucFirst).join(' ')} Release ${release.name}`,
              weight: 'Bolder',
              size: 'Large',
            },
            ...release.body.split(/\n\n+/g).map(
              (s) =>
                ({
                  type: 'TextBlock',
                  text: s.replace(/^[#]+/, '').trim(),
                  wrap: s.includes('\n'),
                  ...(s.startsWith('#') ? { weight: 'Bolder', size: 'Medium' } : {}),
                }) satisfies Body,
            ),
          ],
          actions: [
            {
              type: 'Action.OpenUrl',
              title: 'View Release',
              url: release.html_url,
            },
            {
              type: 'Action.OpenUrl',
              title: 'View Docs App',
              url: docsUrl,
            },
          ],
        },
      },
    ],
  } satisfies TeamsWebhook),
});
if (!teamsResponse.ok) {
  console.error(
    `Failed to send Teams webhook: ${teamsResponse.status} ${teamsResponse.statusText}`,
  );
}

export {};

interface TeamsWebhook {
  type: string;
  attachments: Attachment[];
}

interface Attachment {
  contentType: string;
  content: Content;
}

interface Content {
  type: string;
  version: string;
  msteams: { width: string };
  body: Body[];
  actions: Action[];
}

interface Body {
  type: string;
  text: string;
  weight?: string;
  size?: string;
  wrap?: boolean;
}

interface Action {
  type: string;
  title: string;
  url: string;
}

interface GitHubResponse {
  body: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  html_url: string;
  name: string;
  homepage: string;
}
