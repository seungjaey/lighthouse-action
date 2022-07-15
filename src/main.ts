import * as core from '@actions/core'
import * as github from '@actions/github'
import log from './logger'
import parseInput from './utils/parseInput'

async function run(): Promise<void> {
  try {
    log('StartUp')
    const input = parseInput()
    const {ghToken} = input
    log('--------')
    log(github.context)
    log('--------')
    log(input)
    log('--------')
    try {
      const {context, getOctokit} = github
      const pull_number = context.payload.pull_request?.number || 0
      const ocktokit = getOctokit(ghToken)
      await ocktokit.rest.issues.createComment({
        ...context.repo,
        issue_number: pull_number,
        body: 'test'
      })
    } catch (e) {
      log(e)
    }
    core.setOutput('OUTPUT_MD', 'test')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
