import { ExtractValue, SelectItem } from '@/types/types'
import { accDiv } from './acc'
import numeral from 'numeral'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import tokenDisplayName from '@/const/tokenDisplayName'
import chainDisplayName from '@/const/chainDisplayName'

export function getActualAmount(amount: string | number, presicion?: number) {
    return accDiv(Number(amount), presicion ?? 1e6)
}

export function getFixedAmount(amount: string | number, decimal: number = 2) {
    if (typeof Number(decimal) === 'number') {
        return Number(myFixed(String(amount), decimal))
    } else {
        return 0
    }
}

export function formatAmountWithDollar(amount: string | number, decimal: number = 0) {
    if (amount) {
        const decimalLength = Array(decimal ? decimal + 1 : 0).join('0')
        return numeral(amount).format(`$0,0.[${decimalLength}]`)
    } else {
        return '--'
    }
}

/**
 * 根据精度自动格式化
 * @param amount
 * @param decimal
 * @returns
 */
export function formatAmountWithDollarDecimal(amount: string | number) {
    if (amount) {
        let decimal = 0
        if (amount > 1) {
            decimal = 2
        } else if (amount >= 0.01 && amount < 1) {
            decimal = 4
        } else if (amount >= 0.0001 && amount < 0.01) {
            decimal = 6
        } else {
            decimal = 8
        }
        const decimalLength = Array(decimal ? decimal + 1 : 0).join('0')
        return numeral(amount).format(`$0,0.[${decimalLength}]`)
    } else {
        return '--'
    }
}

export function formatPercentage(amount: string | number) {
    return numeral(amount).format('0.000%')
}

/*
 * cosmos1p2s0gv05xkm2ajrrku4xv2t9e64cvu4tn289zt 换为 cosmos1p2s0gv...n289zt
 */
export function encodeAddress(address: string, short: boolean = true) {
    let length = 13
    if (short) {
        length = 6
    }
    if (address && typeof address === 'string' && address.trim() && address.length > 20) {
        return `${address.substring(0, length)}...${address.substring(address.length - 6)}`
    } else {
        return address
    }
}

/**
 * 保留小数点几位数, 自动补零, 四舍五入
 * @param num: 数值
 * @param digit: 小数点后位数
 * @returns string
 */
export function myFixed(num: string, digit: number): string {
    if (Object.is(parseFloat(num), NaN)) {
        console.log(`传入的值：${num}不是一个数字`)
        return '0'
    }
    const numFloat = parseFloat(num)
    return (Math.round((numFloat + Number.EPSILON) * Math.pow(10, digit)) / Math.pow(10, digit)).toFixed(digit)
}

export const genMapObject = <T extends Readonly<SelectItem[]>>(originData: T) => {
    const o: {
        [K in T[number]['value']]: ExtractValue<T[number], K>
    } = Object.create(null)
    originData.forEach(item => {
        o[item.value as T[number]['value']] = item.label as ExtractValue<T[number], T[number]['value']>
    })
    return o
}

function isURL(url: string) {
    var strRegex = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/
    var re = new RegExp(strRegex)
    return re.test(url)
}

/**
 *
 * @param name 图片名称
 * @returns
 */
export const getImageSrc = (name: string) => {
    // const path = `/src/assets/images/${name}`;
    // const modules = import.meta.globEager('/src/assets/images/*');
    // return modules[path].default;
    if (isURL(name)) {
        return name
    } else {
        return new URL(`../assets/images/${name}`, import.meta.url).href
    }
}

export function timeToLocal(originalTime) {
    const d = new Date(originalTime * 1000)
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()) / 1000
}

export function transformTime(timestamp) {
    dayjs.extend(utc)
    return dayjs.utc(timestamp * 1000).format('YYYY/MM/DD HH:mm:ss')
}

/**
 * 获取 币 显示名称
 * @param token
 * @returns
 */
export function getTokenDisplayName(token: string) {
    if (token) {
        const displayInfo = tokenDisplayName.find(v => v.key === token)
        if (displayInfo) {
            return displayInfo.displayName
        } else {
            return token?.toUpperCase()
        }
    } else {
        return ''
    }
}

/**
 * 获取 chain 显示名称
 * @param chain
 * @returns
 */
export function getChainDisplayName(chain: string) {
    if (chain) {
        const displayInfo = chainDisplayName.find(v => v.key === chain)
        if (displayInfo) {
            return displayInfo.displayName
        } else {
            return chain?.toUpperCase()
        }
    } else {
        return ''
    }
}

/**
 * 获取链类型
 */
export function getChainTypeByAddress(address?: string | null) {
    if (address) {
        if (address.startsWith('cosmos')) {
            return 'cosmos'
        } else if (address.startsWith('osmo')) {
            return 'osmosis'
        } else if (address.startsWith('mantle')) {
            return 'asset-mantle'
        } else if (address.startsWith('juno')) {
            return 'juno'
        } else if (address.startsWith('evmos')) {
            return 'evmos'
        } else if (address.startsWith('cre')) {
            return 'crescent'
        } else {
            return ''
        }
    } else {
        return ''
    }
}

export function getVoteOption(option: string) {
    if (option) {
        return option.substring('VOTE_OPTION_'.length)
    }
    return ''
}
