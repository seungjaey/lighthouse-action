import {debug} from '@actions/core'

export default function log(target: unknown): void {
  debug(JSON.stringify(target))
}
