import {getInput, getMultilineInput} from '@actions/core'
import inputName from '../constants/InputName'

interface InputData {
  urlPrefix: string
  urlList: UrlList
  ghToken: string
}

type UrlList = UrlItem[]

interface UrlItem {
  label: string
  url: string
  path: string
  pathSlug: string
}

const parseRawInputUrlList = (
  urlPrefix: string,
  urlStringList: string[]
): UrlList => {
  return urlStringList.map(str => {
    const [label, path] = str.split('__SEP__')
    return {
      label,
      path,
      url: `${urlPrefix}${path}`,
      pathSlug: path.replace(/\//, '_')
    }
  })
}

export default function parseInput(): InputData {
  const urlPrefix = getInput(inputName.INPUT_URL_PREFIX)
  const rawUrlList = getMultilineInput(inputName.INPUT_URL_LIST)
  const ghToken = getInput(inputName.INPUT_GH_TOKEN)
  return {
    urlPrefix,
    urlList: parseRawInputUrlList(urlPrefix, rawUrlList),
    ghToken
  }
}
