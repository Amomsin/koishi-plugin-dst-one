import { Context, Schema } from 'koishi'
import { extendDatabaseModel, getSimpleInfoAsync, getDetailInfoAsync, getbyname } from './botClient'

export const name = 'dst-one'

export const inject = {
  required: ['database'],
}

export interface Config {
  Authority: number
  Interval: number
  Token: string
  DefaultRgion: any
  DefaultPlatform: any
  Instruction_Name: any
  Instruction_id: any
}

export const Config: Schema<Config> = Schema.object({
  Authority: Schema.number().default(1).description('权限等级'),
  Interval: Schema.number().default(120000).description('任务间隔时间（毫秒）'),
  Token: Schema.string().description('API Token').required(),
  DefaultRgion: Schema.array(Schema.union([
    Schema.const('ap-east-1').description('ap-east-1'),
    Schema.const('us-east-1').description('us-east-1'),
    Schema.const('eu-central-1').description('eu-central-1'),
    Schema.const('ap-southeast-1').description('ap-southeast-1'),
  ])).role('table').default(["ap-east-1", "us-east-1"]).description('设置默认查询的游戏地区'),
  DefaultPlatform: Schema.array(Schema.union([
    Schema.const('Steam').description('Steam'),
    Schema.const('Rail').description('WeGame'),
  ])).role('table').default(["Steam", "Rail"]).description('默认平台'),
  Instruction_Name: Schema.array(Schema.string()).role('table').default(['\/查房', 's-simple']).description('指令名称'),
  Instruction_id: Schema.array(Schema.string()).role('table').default(['\/信息']).description('指令ID'),
})

export function apply(ctx: Context, config: Config) {
  // 扩展数据库模型
  extendDatabaseModel(ctx)
  let IntervalId
  // 设置定时任务
  ctx.on('ready', async () => {
    IntervalId = setInterval(someFunction, config.Interval)
  })

  ctx.on('dispose', async () => {
    clearInterval(IntervalId)
  })

  config.Instruction_Name.forEach((name: string) => {
    ctx.command('s-simple [name]', "查询饥荒联机服务器简略信息", { authority: config.Authority })
      .alias(name.replace('\\/', ''))
      .action(async (Session, name) => {
        const results = await getbyname(ctx, name);
        if (results.length > 0) {
          return results;
        } else {
          return '未找到匹配的结果';
        }
      });
  });

  config.Instruction_id.forEach((name: string) => {
  ctx.command('s-detail [name]', "查询饥荒联机单个服务器详细信息", { authority: config.Authority })
    .alias(name.replace('\\/', ''))
    .action(async (Session, name) => {
      console.log('index:', name)
      try {
        const send = await getDetailInfoAsync(ctx, config, name)
        return send
      } catch (error) {
        return "请先查询再选择！"
      }
    })
  })

  // 示例函数，定时任务将调用此函数
  async function someFunction() {
    // 在这里编写你的定时任务逻辑
    await getSimpleInfoAsync(ctx, config)
    console.log('定时任务执行成功')
  }
}

