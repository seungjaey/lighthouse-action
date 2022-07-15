import * as core from '@actions/core'
import github, { getOctokit } from '@actions/github'
import log from './logger'
import parseInput from './utils/parseInput'

async function run(): Promise<void> {
  try {
    log('StartUp')
    const input = parseInput()
    const { ghToken } = input
    const { context } = github
    const pull_number = context.payload.pull_request?.number || 0
    log('--------')
    log(github.context)
    log('--------')
    log(input)
    log('--------')

    const ocktokit = getOctokit(ghToken)
    await ocktokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pull_number,
      body: 'test'
    })

    core.setOutput('OUTPUT_MD', 'test')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
