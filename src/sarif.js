const core = require('@actions/core');
const { Octokit } = require('@octokit/core');

/*
  Need to extract:
    - Scan results link
    - HawkScan Version
    - Failure Threshold Setting
 */

// https://docs.github.com/en/rest/reference/code-scanning#upload-an-analysis-as-sarif-data--code-samples
module.exports.uploadSarif = async function uploadSarif(scanData) {
  const resultsLink = scanData.resultsLink;
  const hawkscanVersion = scanData.hawkscanVersion;
  const failureThreshold = scanData.failureThreshold;
  const sarifContent = sarifBuilder(resultsLink, hawkscanVersion, failureThreshold)
  core.debug(`Running SARIF upload with results link: ${scanData.resultsLink}`);
  core.debug(`Running SARIF upload with HawkScan version: ${scanData.hawkscanVersion}`);
  core.debug(`Running SARIF upload with failure threshold: ${scanData.failureThreshold}`);
  core.debug(`SARIF file contents:\n${sarifContent}`);

  const githubToken = core.getInput('githubToken', { required: true });
  const octokit = new Octokit({ auth: githubToken });
  const githubRepository = process.env['GITHUB_REPOSITORY'];
  if (value === undefined || value.length === 0) {
    throw new Error(`${paramName} environment variable must be set`);
  }
  const [owner, repo] = githubRepository.split('/');
  const ref = getRef();
  const commit_sha = getRequiredEnvParam('GITHUB_SHA');
  const zipped_sarif = zlib.gzipSync(JSON.stringify(sarif)).toString('base64');

  await octokit.request('POST /repos/:owner/:repo/code-scanning/sarifs', {
    owner,
    repo,
    commit_sha,
    ref,
    sarif: zipped_sarif,
    tool_name: '42Crunch REST API Static Security Testing',
    checkout_uri: url.pathToFileURL(process.cwd()).toString(),
  });

}

function sarifBuilder(resultsLink, hawscanVersion, failureThreshold) {
  return JSON.stringify({
    "version": "2.1.0",
    "$schema": "http://json.schemastore.org/sarif-2.1.0",
    "runs": [
      {
        "tool": {
          "driver": {
            "name": "HawkScan",
            "version": hawscanVersion,
            "semanticVersion": hawscanVersion,
            "informationUri": "https://docs.stackhawk.com/hawkscan/",
            "rules": [
              {
                "id": "alert/threshold-met",
                "name": "alert/threshold-met",
                "helpUri": "https://docs.stackhawk.com/web-app/scans.html#scan-details-page",
                "help": {
                  "text": "HawkScan found results that meet or exceed your failure threshold, `hawk.failureThreshold`"
                },
                "shortDescription": {
                  "text": "HawkScan found results that meet or exceed your failure threshold"
                },
                "properties": {
                  "tags": [
                    "Alert Threshold Met"
                  ]
                }
              }
            ]
          }
        },
        "results": [
          {
            "level": "warning",
            "locations": [
              {
                "id": 1,
                "physicalLocation": {
                  "region": {
                    "startLine": 1
                  },
                  "artifactLocation": {
                    "uri": "nofile.md"
                  }
                }
              }
            ],
            "message": {
              "text": `HawkScan found issues that meet or exceed your failure threshold.\n\`hawk.failureThreshold=${failureThreshold}\`.\nSee [Scan Results](${resultsLink}) for more details.`
            },
            "ruleId": "alert/threshold-met"
          }
        ]
      }
    ]
  });
}
