import { Context, Schema } from 'koishi'
import { extendDatabaseModel, getSimpleInfoAsync, getDetailInfoAsync, formatResults ,getbyname} from './botClient'

export const name = 'dst-one'

export const inject = {
  required: ['database'],
}

export interface Config {
  Authority: number
  Interval: number
  Token: string
  DefaultRgion: string[]
  DefaultPlatform: string[]
}

export const Config: Schema<Config> = Schema.object({
  Authority: Schema.number().default(1).description('权限等级'),
  Interval: Schema.number().default(60000).description('任务间隔时间（毫秒）'),
  Token: Schema.string().description('API Token'),
  DefaultRgion: Schema.array(Schema.string()).default(['ap-east-1']).description('默认区域'),
  DefaultPlatform: Schema.array(Schema.string()).default(['Steam', 'Rail']).description('默认平台'),
})

export function apply(ctx: Context, config: Config) {
  // 扩展数据库模型
  extendDatabaseModel(ctx)

  // 设置定时任务
  ctx.setInterval(async () => {
    try {
      await someFunction(ctx, config);
      console.log('定时任务执行成功');
    } catch (err) {
      console.error('定时任务执行失败:', err);
    }
  }, 300000); // 30000 毫秒

  ctx.command('s-simple [name]', "查询饥荒联机服务器简略信息", { authority: config.Authority })
    .shortcut(/^\/查房 (.*)*$/, { args: ['$1'] })
    .shortcut(/^\/查房$/, { args: ['$1'] })
    .action(async (Session, name) => {
      // const results = await getSimpleInfoAsync(ctx, config)
      const results = await getbyname(ctx, name)
      if (results.length > 0) {
        return formatResults(results)
      } else {
        return '未找到匹配的结果'
      }
    })

    ctx.command('s-detail [number]', "查询饥荒联机单个服务器详细信息", { authority: config.Authority })
    .shortcut(/^\.(.*)*$/, { args: ['$1'] })
    .shortcut(/^\。(.*)*$/, { args: ['$1'] })
    .action(async (Session, numberStr) => {
      const userId = Session.session.userId
      // const index = Number.parseInt(numberStr)
      console.log('index:', numberStr)
      try {
        const send = await getDetailInfoAsync(ctx, config, numberStr)
        // if (config.IsSendImage) {
        //   // 如果需要发送图片，可以在这里添加生成图片的逻辑
        //   // 例如：send = await generateImage(ctx, send)
        // }
        return send
      } catch (error) {
        return "请先查询再选择！"
      }
    })
}

// 示例函数，定时任务将调用此函数
async function someFunction(ctx: Context, config: Config) {
  // 在这里编写你的定时任务逻辑
  getSimpleInfoAsync(ctx, config)
  console.log('定时任务执行成功')
}