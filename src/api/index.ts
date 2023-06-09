import axios from 'axios'
import { DISPLAY_COIN_LIST } from '@/const/displayCoinList'
import txAction from '@/const/txAction'
import { getActualAmount, getFixedAmount, timeToLocal, getTokenDisplayName } from '@/utils'
import { ReturnDownBack } from '@vicons/ionicons5'

// 从 https://www.mintscan.io/cosmos 获取 atom 价格信息
export const getAtomPriceApi = () => {
    return axios.get('/backend/cosmostation/v1/market/price?id=uatom')
}

// 获取市场所有的币信息
export const getMarketPricesApi = () => {
    return new Promise((resolve, reject) => {
        axios
            .get('/backend/cosmostation/v1/market/prices')
            .then((res: any) => {
                const coins = Object.keys(DISPLAY_COIN_LIST)
                if (res.length > 0) {
                    // 筛选出展示的 coin
                    const coinList = res.filter(v => {
                        return coins.includes(v.denom)
                    })
                    // 按照指定顺序排序
                    coinList.sort((a, b) => {
                        return coins.indexOf(a.denom) - coins.indexOf(b.denom)
                    })
                    const displayCoinList = coinList.map(v => {
                        return {
                            currentPrice: v.prices?.[0]?.current_price,
                            currentPriceUnit: v.prices?.[0]?.currency,
                            marketCap: getFixedAmount(v.prices?.[0]?.market_cap),
                            marketCapUnit: v.prices?.[0]?.currency,
                            dailyPriceChangeInPercentage: getFixedAmount(v.prices?.[0]?.daily_price_change_in_percentage),
                            lastUpdated: v.last_updated,
                            ...DISPLAY_COIN_LIST[v.denom],
                        }
                    })
                    resolve(displayCoinList)
                } else {
                    reject(res)
                }
            })
            .catch(error => {
                reject(error)
            })
    })
}

// 查询币信息列表
export const queryTokenListByChain = (chain: string) => {
    return new Promise((resolve, reject) => {
        axios
            .post('/backend/ibccoin/api/v1/model/tokens', {
                page_size: 1000,
                chain,
            })
            .then((res: any) => {
                if (res.code === 0) {
                    const result = res.data?.items.map(v => {
                        return {
                            chain: v.chain,
                            icon: v.moniker,
                            name: v.token_name,
                            coinPair: `${v.token_name} / usd`,
                        }
                    })
                    resolve(result)
                } else {
                    reject(res)
                }
            })
            .catch(error => {
                reject(error)
            })
    })
}

interface TokenStaticStatusReq {
    token_ids?: string[]
    chain?: string
    token_names?: string[]
}

// 查询币信息列表（包括市值、币价等）
export const queryTokenStaticStatusListByChain = (params: TokenStaticStatusReq) => {
    return new Promise((resolve, reject) => {
        axios
            .post('/backend/ibccoin/api/v1/kline/query_token_static_status', params)
            .then((res: any) => {
                if (res.code === 0) {
                    const result = res.data?.map(v => {
                        return {
                            tokenId: v.token_id,
                            chain: v.token.chain,
                            icon: v.token.moniker,
                            name: v.token.token_name,
                            coinPair: `${getTokenDisplayName(v.token.token_name)} / USDC`,
                            currentPrice: v.price,
                            currentPriceUnit: 'usdc',
                            marketCap: v.market_cap,
                            marketCapUnit: 'usdc',
                            dailyPriceChangeInPercentage: getFixedAmount(v.daily_price_change_in_percentage),
                            totalVolume: v.total_volume,
                            lastUpdated: v.update_timestamp,
                        }
                    })
                    resolve(result)
                } else {
                    reject(res)
                }
            })
            .catch(error => {
                reject(error)
            })
    })
}
export interface KLineRequestParams {
    token_id: number | string // token在数据库中的id
    k_line_interval: string // k线级别，可选参数为 5s,30s,5m,30m,1h,1d
    timestamp_start?: number // 时间范围起点时间戳，单位s。如果不填写，则根据timestamp_end自动向前推一段时间
    timestamp_end?: number // 时间范围终点时间戳，单位s。如果不填，则默认为当前时间
}

// 查询 K 线图信息
export const queryKLine = (requestParams: KLineRequestParams) => {
    return new Promise((resolve, reject) => {
        axios
            .post('/backend/ibccoin/api/v1/kline/query_kline', requestParams)
            .then((res: any) => {
                if (res.code === 0) {
                    const result = res.data.map(v => {
                        return {
                            time: timeToLocal(v.k_line_start_timestamp),
                            open: v.open_price,
                            high: v.max_price,
                            low: v.min_price,
                            close: v.close_price,
                        }
                    })
                    resolve(result)
                } else {
                    reject(res)
                }
            })
            .catch(error => {
                reject(error)
            })
    })
}

interface TradingHistoryReq {
    chain?: string // 根据链名进行筛选，如'osmosis'
    token_id?: string // 根据token id进行筛选
    min_total_value?: number // 根据交易金额筛选，这里是下限，单位usd
    max_total_value?: number // 金额上线
    order_by_total_value?: boolean // 是否按照交易金额进行降序排列，不传或者为false时，使用交易时间降序排列
    user_address?: string // 根据钱包地址进行筛选
    page?: number // 第几页，默认1
    page_size?: number // 每页大小，默认10
}

export interface TradingHistoryRes {
    txTimestamp: number // 交易时间
    userAddress: string // 用户钱包地址
    txHash: string // 交易哈希
    txTotalVolume: string // 交易总价值
    amountFrom: string // 付出token数量
    amountTo: string // 获得token数量
    chain: string // 交易所在链
    id: string
    tokenNameFrom: string // 付出token的基本信息-币名称
    tokenNameTo: string // 获得token的信息-币名称
}

// 查询 交易信息 数据
export const queryTradingHistory = (requestParams: TradingHistoryReq) => {
    return new Promise((resolve, reject) => {
        axios
            .post('/backend/ibccoin/api/v1/transaction/query', requestParams)
            .then((res: any) => {
                if (res.code === 0) {
                    const result: TradingHistoryRes[] = res.data?.items?.map(v => {
                        return {
                            txTimestamp: v.tx_timestamp,
                            userAddress: v.user_address,
                            txHash: v.tx_hash,
                            txTotalVolume: v.total_value,
                            amountFrom: getActualAmount(v.amount_from, Math.pow(10, v.token_from.decimals ?? 0)),
                            amountTo: getActualAmount(v.amount_to, Math.pow(10, v.token_to.decimals ?? 0)),
                            chain: v.chain,
                            id: v.id,
                            tokenNameFrom: v.token_from.token_name,
                            tokenNameTo: v.token_to.token_name,
                        }
                    })
                    resolve({ items: result, total: res.data.total })
                } else {
                    reject(res)
                }
            })
            .catch(error => {
                reject(error)
            })
    })
}

interface TxReq {
    address: string
    action: any
    limit: number
    offset: number
}

// 查询 cosmos network Tx 信息
export const queryCosmosTxs = (txReq: TxReq) => {
    let requestParams = `pagination.limit=${txReq.limit}&pagination.offset=${txReq.offset}&orderBy=ORDER_BY_DESC&events=message.sender%3D'${txReq.address}'&events=message.action%3D'%2F${txReq.action.action}'`
    if (txReq.action.isReceiver) {
        requestParams = `pagination.limit=${txReq.limit}&pagination.offset=${txReq.offset}&orderBy=ORDER_BY_DESC&events=transfer.recipient%3D'${txReq.address}'&events=message.action%3D'%2F${txReq.action.action}'`
    }
    return new Promise((resolve, reject) => {
        axios
            .get(`/backend/cosmosNetwork/cosmos/tx/v1beta1/txs?${requestParams}`)
            .then((res: any) => {
                if (res) {
                    resolve({ items: res.tx_responses, pagination: res.pagination })
                } else {
                    reject({ items: [], pagination: { total: 0, next_key: null } })
                }
            })
            .catch(error => {
                reject({ items: [], pagination: { total: 0, next_key: null } })
            })
    })
}

// 查询 osmosis Tx 信息
export const queryOsmosisTxs = (txReq: TxReq) => {
    let requestParams = `pagination.limit=${txReq.limit}&pagination.offset=${txReq.offset}&orderBy=ORDER_BY_DESC&events=message.sender%3D'${txReq.address}'&events=message.action%3D'%2F${txReq.action.action}'`
    if (txReq.action.isReceiver) {
        requestParams = `pagination.limit=${txReq.limit}&pagination.offset=${txReq.offset}&orderBy=ORDER_BY_DESC&events=transfer.recipient%3D'${txReq.address}'&events=message.action%3D'%2F${txReq.action.action}'`
    }
    return new Promise((resolve, reject) => {
        axios
            .get(`/backend/osmosis/osmo-lcd/cosmos/tx/v1beta1/txs?${requestParams}`)
            .then((res: any) => {
                if (res) {
                    resolve({ items: res.tx_responses, pagination: res.pagination })
                } else {
                    reject({ items: [], pagination: { total: 0, next_key: null } })
                }
            })
            .catch(error => {
                reject({ items: [], pagination: { total: 0, next_key: null } })
            })
    })
}

// 查询 Evmos Tx 信息
export const queryEvmosTxs = (txReq: TxReq) => {
    let requestParams = `pagination.limit=${txReq.limit}&pagination.offset=${txReq.offset}&orderBy=ORDER_BY_DESC&events=message.sender%3D'${txReq.address}'&events=message.action%3D'%2F${txReq.action.action}'`
    if (txReq.action.isReceiver) {
        requestParams = `pagination.limit=${txReq.limit}&pagination.offset=${txReq.offset}&orderBy=ORDER_BY_DESC&events=transfer.recipient%3D'${txReq.address}'&events=message.action%3D'%2F${txReq.action.action}'`
    }
    return new Promise((resolve, reject) => {
        axios
            .get(`/backend/evmos/cosmos/tx/v1beta1/txs?${requestParams}`)
            .then((res: any) => {
                if (res) {
                    resolve({ items: res.tx_responses, pagination: res.pagination })
                } else {
                    reject({ items: [], pagination: { total: 0, next_key: null } })
                }
            })
            .catch(error => {
                reject({ items: [], pagination: { total: 0, next_key: null } })
            })
    })
}

// 查询 Juno Tx 信息
export const queryJunoTxs = (txReq: TxReq) => {
    let requestParams = `pagination.limit=${txReq.limit}&pagination.offset=${txReq.offset}&orderBy=ORDER_BY_DESC&events=message.sender%3D'${txReq.address}'&events=message.action%3D'%2F${txReq.action.action}'`
    if (txReq.action.isReceiver) {
        requestParams = `pagination.limit=${txReq.limit}&pagination.offset=${txReq.offset}&orderBy=ORDER_BY_DESC&events=transfer.recipient%3D'${txReq.address}'&events=message.action%3D'%2F${txReq.action.action}'`
    }
    return new Promise((resolve, reject) => {
        axios
            .get(`/backend/juno/cosmos/tx/v1beta1/txs?${requestParams}`)
            .then((res: any) => {
                if (res) {
                    resolve({ items: res.tx_responses, pagination: res.pagination })
                } else {
                    reject({ items: [], pagination: { total: 0, next_key: null } })
                }
            })
            .catch(error => {
                reject({ items: [], pagination: { total: 0, next_key: null } })
            })
    })
}

// 查询 assetmantle Tx 信息
export const queryAssetMantleTxs = (txReq: TxReq) => {
    let requestParams = `pagination.limit=${txReq.limit}&pagination.offset=${txReq.offset}&orderBy=ORDER_BY_DESC&events=message.sender%3D'${txReq.address}'&events=message.action%3D'%2F${txReq.action.action}'`
    if (txReq.action.isReceiver) {
        requestParams = `pagination.limit=${txReq.limit}&pagination.offset=${txReq.offset}&orderBy=ORDER_BY_DESC&events=transfer.recipient%3D'${txReq.address}'&events=message.action%3D'%2F${txReq.action.action}'`
    }
    return new Promise((resolve, reject) => {
        axios
            .get(`/backend/assetmantle/cosmos/tx/v1beta1/txs?${requestParams}`)
            .then((res: any) => {
                if (res) {
                    resolve({ items: res.tx_responses, pagination: res.pagination })
                } else {
                    reject({ items: [], pagination: { total: 0, next_key: null } })
                }
            })
            .catch(error => {
                reject({ items: [], pagination: { total: 0, next_key: null } })
            })
    })
}

// 查询 crescent Tx 信息
export const queryCrescentTxs = (txReq: TxReq) => {
    let requestParams = `pagination.limit=${txReq.limit}&pagination.offset=${txReq.offset}&orderBy=ORDER_BY_DESC&events=message.sender%3D'${txReq.address}'&events=message.action%3D'%2F${txReq.action.action}'`
    if (txReq.action.isReceiver) {
        requestParams = `pagination.limit=${txReq.limit}&pagination.offset=${txReq.offset}&orderBy=ORDER_BY_DESC&events=transfer.recipient%3D'${txReq.address}'&events=message.action%3D'%2F${txReq.action.action}'`
    }
    return new Promise((resolve, reject) => {
        axios
            .get(`/backend/crescent/cosmos/tx/v1beta1/txs?${requestParams}`)
            .then((res: any) => {
                if (res) {
                    resolve({ items: res.tx_responses, pagination: res.pagination })
                } else {
                    reject({ items: [], pagination: { total: 0, next_key: null } })
                }
            })
            .catch(error => {
                reject({ items: [], pagination: { total: 0, next_key: null } })
            })
    })
}

export const queryTxs = (txReq: TxReq, chain: string) => {
    if (chain === 'crescent') {
        return queryCrescentTxs(txReq)
    } else if (chain === 'osmosis') {
        return queryOsmosisTxs(txReq)
    } else if (chain === 'cosmos') {
        return queryCosmosTxs(txReq)
    } else if (chain === 'asset-mantle') {
        return queryAssetMantleTxs(txReq)
    } else if (chain === 'juno') {
        return queryJunoTxs(txReq)
    } else if (chain === 'evmos') {
        return queryEvmosTxs(txReq)
    }
}
