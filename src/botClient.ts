import { Context } from 'koishi'
import fetch from 'node-fetch'
import { SimpleInfo } from './koishi'
import { Config } from '.'


// 扩展数据库模型
export function extendDatabaseModel(ctx: Context) {
    ctx.model.extend('simpleInfo', {
        id: 'unsigned',
        name: 'string',
        mode: 'string',
        rowId: 'string',
        season: 'string',
        maxconnections: 'integer',
        connected: 'integer',
        version: 'string',
        platform: 'string',
    })
}

// 数据库操作函数
export async function createSimpleInfo(ctx: Context, data: SimpleInfo[]) {
    // ctx.database.drop('simpleInfo')
    try {
        await ctx.database.upsert('simpleInfo', data, 'rowId')
        console.log('SimpleInfo 数据创建成功')
    } catch (err) {
        console.error('创建 SimpleInfo 数据失败:', err)
    }
}

export async function querySimpleInfo(ctx: Context, query: Partial<SimpleInfo>) {
    try {
        // 构建模糊匹配查询条件
        const conditions = Object.entries(query).map(([key, value]) => {
            return { [key]: { $regex: `.*${value}.*` } };
        });

        // 合并查询条件
        const combinedQuery = conditions.length > 1 ? { $and: conditions } : conditions[0];

        const results = await ctx.database.get('simpleInfo', combinedQuery);
        // console.log('查询结果:', results);
        return results;
    } catch (err) {
        console.error('查询 SimpleInfo 数据失败:', err);
        return [];
    }
}

export async function updateSimpleInfo(ctx: Context, query: Partial<SimpleInfo>, update: Partial<SimpleInfo>) {
    try {
        const result = await ctx.database.set('simpleInfo', query, update)
        console.log('更新结果:', result)
        return result
    } catch (err) {
        console.error('更新 SimpleInfo 数据失败:', err)
        return null
    }
}

export async function removeSimpleInfo(ctx: Context, query: Partial<SimpleInfo>) {
    try {
        const result = await ctx.database.remove('simpleInfo', query)
        console.log('删除结果:', result)
        return result
    } catch (err) {
        console.error('删除 SimpleInfo 数据失败:', err)
        return null
    }
}


export async function getSimpleInfoAsync(ctx: Context, config: Config) {
    const result = []
    try {
        for (const region of config.DefaultRgion) {
            for (const platform of config.DefaultPlatform) {
                const url = `https://lobby-v2-cdn.klei.com/${region}-${platform}.json.gz`
                const response = await fetch(url)
                if (response.ok) {
                    const data = await response.json() as { GET: any[] }
                    const resultTemp = data.GET.map(item => ({
                        name: item.name || 'N/A',
                        mode: item.intent || 'N/A',
                        rowId: item.__rowId || 'N/A',
                        season: item.season || 'N/A',
                        maxconnections: item.maxconnections || 'N/A',
                        connected: item.connected || 'N/A',
                        version: item.v || 'N/A',
                        platform: item.platform || 'N/A'
                    }))
                    result.push(...resultTemp)
                }
            }
        }
        // 保存到数据库
        await createSimpleInfo(ctx, result)
    } catch (err) {
        console.error('Failed to get SimpleInfo:', err)
    }
    return '数据获取成功'
}

export async function getDetailInfoAsync(ctx: Context, config: Config, rowId: string): Promise<string> {
    for (const region of config.DefaultRgion) {
        const url = `https://lobby-v2-${region}.klei.com/lobby/read`
        try {
            const payload = {
                "__token": config.Token,
                "__gameId": "DST",
                "Query": {
                    "__rowId": rowId
                }
            }
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            if (response.ok) {
                const data = await response.json() as { GET: any[] }
                const resultTemp = data.GET.map(item => {
                    let players;
                    try {
                        players = parsePlayers(item.players); // 使用正则表达式解析 players 字符串
                    } catch (e) {
                        console.error('Failed to parse players:', e);
                        players = [];
                    }
                    return {
                        id: item.__rowId,
                        name: item.name,
                        address: item.__addr,
                        mode: item.mode,
                        season: item.season,
                        connected: item.connected,
                        maxconnections: item.maxconnections,
                        platform: item.platform,
                        dedicated: item.dedicated,
                        players: players,
                        mods_info: item.mods_info
                    };
                });
                const formattedInfo = resultTemp.map(formatMainInfo).join('\n');
                console.log('DetailInfo:', formattedInfo)

                return formattedInfo
            }
        } catch (err) {
            console.error('Failed to get DetailInfo:', err)
            return '获取详细信息失败'
        }
    }
    return '未找到匹配的结果'
}

function translateMode(mode: string): string {
    const translations: { [key: string]: string } = {
        'endless': '无尽',
        'survival': '生存',
        'wilderness': '荒野',
        'relaxed': '放松',
        'oceanfishing': '海钓'
    };
    return translations[mode] || mode;
}

function translateSeason(season: string): string {
    const translations: { [key: string]: string } = {
        "spring": "春天",
        "summer": "夏天",
        "autumn": "秋天",
        "winter": "冬天"
    };
    return translations[season] || season;
}

function translatePlatform(platform: number): string {
    const translations: { [key: string]: string } = {
        '1': 'Steam',
        '4': 'WeGame',
        '2': 'PlayStation',
        '19': 'XBone',
        '32': 'Switch'
    };
    return translations[platform.toString()] || platform.toString();
}

function translatePrefab(prefab: string): string {
    const prefabTranslations: { [key: string]: string } = {
        'wilson': '威尔逊',
        'willow': '薇洛',
        'wolfgang': '沃尔夫冈',
        'wendy': '温蒂',
        'wickerbottom': '薇克巴顿',
        'woodie': '伍迪',
        'wes': '韦斯',
        'waxwell': '麦斯威尔',
        'wathgrithr': '薇格弗德',
        'webber': '韦伯',
        'winona': '薇诺娜',
        'warly': '沃利',
        'walter': '沃尔特',
        'wortox': '沃拓克斯',
        'wormwood': '沃姆伍德',
        'wurt': '沃特',
        'wanda': '旺达',
        'wonkey': '芜猴',
        'lg_fanglingche': '[海洋传说]方灵澈',
        'lg_lilingyi': '[海洋传说]李令仪',
        'musha': '[精灵公主]穆莎',
    };
    return prefabTranslations[prefab] || prefab;
}

function translateAddress(address: string): string {
    // 如果地址是 127.0.0.1，说明是本地服务器
    if (address === '127.0.0.1') {
        return '本地服务器';
    }
    return address;
}

function parsePlayers(playersStr: string): any[] {
    const playerRegex = /{\s*colour="([^"]+)",\s*eventlevel=(\d+),\s*name="([^"]+)",\s*netid="([^"]+)",\s*prefab="([^"]+)"\s*}/g;
    const players = [];
    let match;
    while ((match = playerRegex.exec(playersStr)) !== null) {
        players.push({
            colour: match[1],
            eventlevel: parseInt(match[2], 10),
            name: match[3],
            netid: match[4],
            prefab: match[5]
        });
    }
    return players;
}

function formatPlayers(players: any[]): string {
    return players.map((player, index) => 
        `${index + 1}. ${player.name},(${translatePrefab(player.prefab)}))`
    ).join('\n');
}

function formatMods(modsInfo: any[]): string {
    const formattedMods = [];
    let counter = 1;
    for (let i = 0; i < modsInfo.length; i += 5) {
        formattedMods.push(
            // `ID: ${modsInfo[i]}, 名称: ${modsInfo[i + 1]}, 版本: ${modsInfo[i + 2]}, 启用: ${modsInfo[i + 4]}`
            `${counter}. 名称: ${modsInfo[i + 1]}`
        );
        counter++;
    }
    return formattedMods.join('\n');
}

function formatMainInfo(data: any): string {
    const mainInfo = (
        `房间名: ${data.name}\n` +
        `服务器地址: ${translateAddress(data.address)}\n` +
        `模式: ${translateMode(data.mode)}\n` +
        `季节: ${translateSeason(data.season)}\n` +
        `当前在线玩家数: ${data.connected}/${data.maxconnections}\n` +
        `平台: ${translatePlatform(data.platform)}\n` +
        `是否专用服务器: ${data.dedicated}\n` +
        `玩家信息: \n${formatPlayers(data.players)}\n` +
        `MOD信息: \n${formatMods(data.mods_info)}`
    );
    return mainInfo;
}

export async function getbyname(ctx: Context, name: string) {
    const result = await querySimpleInfo(ctx, { name })
    return result
}

function checkNaN(value: number): number {
    return isNaN(value) ? 0 : value;
  }

export function formatResults(results: SimpleInfo[]) {
    return results.map(result => `服务器名称: ${result.name},\n模式: ${translateMode(result.mode)},\n连接数: ${checkNaN(result.connected)}/${result.maxconnections},\n服务器ID: ${result.rowId}`).join('\n')
}