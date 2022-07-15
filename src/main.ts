import * as core from '@actions/core'
import * as github from '@actions/github'
import {mkdir, opendir, writeFile} from 'fs/promises'
import {
  pipe,
  map,
  toArray,
  toAsync,
  entries,
  groupBy,
  range,
  keys,
  flat
} from '@fxts/core'
import parseInput from './utils/parseInput'

import * as lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import * as minifier from 'html-minifier'

import FormFactor, {
  FormFactorList,
  FormFactorName
} from './constants/FormFactor'

import DefaultDesktopConfig from 'lighthouse/lighthouse-core/config/desktop-config'
import DefaultConfig from 'lighthouse/lighthouse-core/config/default-config'

/*
1. Spawn Server
2. lighthouse report
3. parse report
4. upload 'final-screenshot'
5. report data to md
6. set ouput [MD_STR, ARTIFACT]
 */

async function setupResultDir(resultDirPath: string): Promise<boolean> {
  try {
    const dir = await opendir(resultDirPath)
    await dir.close()
    return true
  } catch (err) {
    await mkdir(resultDirPath)
    return true
  }
}

async function run(): Promise<void> {
  try {
    const {getOctokit} = github
    const input = parseInput()
    const {urlList, ghToken} = input
    const ocktokit = getOctokit(ghToken)
    const RESULT_DIR_PATH = './lighthouse-result'
    const ENTRY_TIME = Date.now()
    await setupResultDir(RESULT_DIR_PATH)
    const scoreToColor = (res: number): string =>
      res >= 90 ? '🟢' : res >= 50 ? '🟠' : '🔴'
    const CHROME_FLAG_LIST = [
      '--headless',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-sandbox'
    ]
    const chrome = await chromeLauncher.launch({
      chromeFlags: CHROME_FLAG_LIST
    })
    const lighthouseFlags = {
      logLevel: 'info',
      output: 'json',
      port: chrome.port
    }
    const lighthouseConfigs = {
      [FormFactor.mobile]: DefaultConfig,
      [FormFactor.desktop]: DefaultDesktopConfig
    } as Record<FormFactorName, any>

    const uploadImage = async (
      epochTime: number,
      formFactor: string,
      pathSlug: string,
      imageBinaryStr
    ): Promise<string> => {
      try {
        const JPEG_PLACE_HOLDER = 'data:image/jpeg;base64,'
        const result = await ocktokit.rest.repos.createOrUpdateFileContents({
          owner: 'seungjaey',
          repo: 'image-dummy',
          message: 'Adding an image to the repository',
          path: `${epochTime}/${formFactor}/${encodeURIComponent(
            pathSlug
          )}.jpg`,
          committer: {
            name: 'seungjaey',
            email: 'seungjae.yuk@kurlycorp.com'
          },
          content: imageBinaryStr.replace(JPEG_PLACE_HOLDER, '')
        })
        return result?.data?.content?.download_url || ''
      } catch (error) {
        return ''
      }
    }

    const result = await pipe(
      range(urlList.length),
      toAsync,
      map(async index => {
        return pipe(
          FormFactorList,
          toAsync,
          map(async formFactor => [
            index,
            formFactor,
            await lighthouse(
              urlList[index].url,
              lighthouseFlags,
              lighthouseConfigs[formFactor]
            )
          ]),
          map(async args => {
            const [i, formFactor, runnerResult] = args
            const {lhr} = runnerResult
            await writeFile(
              `${RESULT_DIR_PATH}/${formFactor}_${urlList[i].pathSlug}.json`,
              JSON.stringify(lhr),
              {
                encoding: 'utf8'
              }
            )
            const {audits, categories} = lhr
            const scoreKeyNames = pipe(categories, keys, toArray)
            const scoreList = pipe(
              scoreKeyNames,
              map(categoryName => categories[categoryName].score * 100),
              toArray
            )
            const imageBinaryStr = audits['final-screenshot'].details.data
            return [index, formFactor, scoreKeyNames, scoreList, imageBinaryStr]
          }),
          map(async args => {
            const [i, formFactor, scoreKeyNames, scoreList, imageBinaryStr] =
              args
            const {label, path, pathSlug} = urlList[i]
            const imagePath = await uploadImage(
              ENTRY_TIME,
              formFactor,
              pathSlug,
              imageBinaryStr
            )
            return {
              id: `${label} (${path})`,
              formFactor,
              scoreKeyNames,
              scoreList,
              imagePath
            }
          }),
          groupBy(a => a.id),
          entries,
          map(args => {
            const [id, list] = args
            return `
              <details>
                <summary>${id}</summary>
                <table>
                <tbody>
                ${pipe(
                  list,
                  map(a => {
                    const {formFactor, scoreKeyNames, scoreList, imagePath} = a
                    return `
                  <tr>
                    <td>${formFactor}</td> 
                    <td><img src="${imagePath}" width="250" height="250"></td>
                    <td>
                      <dl>
                        <dt>Summary</dt>
                        ${pipe(
                          range(0, scoreKeyNames.length),
                          map(si => {
                            const score = scoreList[si]
                            return `<dd>${scoreToColor(score)} ${
                              scoreKeyNames[si]
                            } ${score}</dd>`
                          }),
                          toArray
                        ).join('\n')}
                      </dl>
                    </td>
                  </tr>
                `
                  }),
                  toArray
                ).join('\n')}
                </tbody>
                </table>
                </details>
            `
          }),
          toArray
        )
      }),
      flat,
      toArray
    )
    const reportMdStr = `### ⚡️ Lighthouse-CI\n${minifier.minify(
      result.join('\n'),
      {
        collapseWhitespace: true,
        removeEmptyElements: true
      }
    )}`
    await writeFile(`${RESULT_DIR_PATH}/report.md`, reportMdStr, {
      encoding: 'utf8'
    })
    await chrome.kill()
    core.setOutput('REPORT_MD_STR', reportMdStr)
  } catch (error) {
    if (error instanceof Error) console.log(error.message)
  }
}

run()
