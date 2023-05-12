import {TransactionBlock } from '@mysten/sui.js';
import { bcsForVersion } from '@mysten/sui.js';
import { LAMPORT, OBJECT_RECORD } from "../config"
import {
    parseSuiRawDataToFarms,
} from '../utils';
import { useEffect, useMemo, useState } from 'react';
import { Connection, JsonRpcProvider } from "@mysten/sui.js";
import { useWalletKit } from '@mysten/wallet-kit';
import BigNumber from 'bignumber.js';

const getProvider = () => {
    return new JsonRpcProvider(
        new Connection({
            fullnode: "https://wallet-rpc.testnet.sui.io/",
            websocket: "wss://fullnode.testnet.sui.io:443",
            faucet: "https://faucet.testnet.sui.io/gas",
        }))
}

export const useGetBalance = (account: string,actionCount: number) => {
    const [data, setAccountBalance] = useState<string>("0");

    useEffect(() => {
        const getbalance = async () => {
            if (account === OBJECT_RECORD.AddressZero)
                setAccountBalance("0");
            else {
                const provider = getProvider();
                let accountBalance = await provider.getBalance({ owner: account });
                let balanceValue = BigNumber(accountBalance?.totalBalance).dividedBy(LAMPORT).toFixed(3) || "0"
                setAccountBalance(balanceValue);
            }
        }
        getbalance();
    }, [account,actionCount])
    return data;
}

export const useGetFarm = (id: string, account: string, actionCount: number) => {

    const [data, setdata] = useState<{}>(NaN);

    useMemo(() => {
        const getFarms = async () => {
            const txb = new TransactionBlock();
            txb.moveCall({
                target: `${OBJECT_RECORD.PACKAGE_ID}::interface::get_farms`,
                arguments: [
                    txb.object(OBJECT_RECORD.MASTERCHEF_STORAGE),
                    txb.object(OBJECT_RECORD.MASTERCHEF_ACCOUNT_STORAGE),
                    txb.pure(account || OBJECT_RECORD.AddressZero),
                    txb.pure(1),
                ],
                typeArguments: [id, id, id, id, id],
            });

            let provider = getProvider();
            const result = await provider.devInspectTransactionBlock({
                transactionBlock: txb,
                sender: account || OBJECT_RECORD.AddressZero,
            });

            const returnValues = result!["results"]![0]!["returnValues"]![0];

            if (!returnValues) return [];
            const bcs = bcsForVersion(await provider.getRpcApiVersion());
            let data = parseSuiRawDataToFarms(
                bcs.de(returnValues[1], Uint8Array.from(returnValues[0]))
            );
            setdata(data);
        }
        getFarms()
    }, [id, account, actionCount])

    return data;
};

export const useGetPendingRewards = (
    account: string | null,
    actionCount: number
) => {
    const [data, setdata] = useState<any>(0);
    useMemo(() => {
        const getPendingRewards = async () => {

            const txb = new TransactionBlock();
            txb.moveCall({
                target: `${OBJECT_RECORD.PACKAGE_ID}::master_chef::get_pending_rewards`,
                typeArguments: ["0x2::sui::SUI"],
                // typeArguments: [`${OBJECT_RECORD.PACKAGE_ID}::ipx::IPX`],
                arguments: [
                    txb.object(OBJECT_RECORD.MASTERCHEF_STORAGE),
                    txb.object(OBJECT_RECORD.MASTERCHEF_ACCOUNT_STORAGE),
                    txb.object(OBJECT_RECORD.CLOCK_OBJECT),
                    txb.pure(account || OBJECT_RECORD.AddressZero),
                ],
            });

            let provider = getProvider();
            const result = await provider.devInspectTransactionBlock({
                transactionBlock: txb,
                sender: account || OBJECT_RECORD.AddressZero,
            });
            const returnValues = result!["results"]![0]!["returnValues"]![0];

            bcsForVersion(await provider.getRpcApiVersion()).de(
                returnValues[1],
                Uint8Array.from(returnValues[0])
            );

            let total_pending_rewawrds = bcsForVersion(await provider.getRpcApiVersion()).de(
                returnValues[1],
                Uint8Array.from(returnValues[0])
            );
            setdata(total_pending_rewawrds);
        }
        getPendingRewards();
    }, [account, , actionCount])
    return data;
};

export const useStakingMethods = () => {
    const {
        signAndExecuteTransactionBlock,
    } = useWalletKit();

    const staking = async (amount) => {
        const txb = new TransactionBlock();
        const [coin] = txb.splitCoins(txb.gas, [txb.pure(amount)]);
        const packageObjectId = OBJECT_RECORD.PACKAGE_ID;
        txb.moveCall({
            target: `${packageObjectId}::interface::stake`,
            arguments: [
                txb.object(OBJECT_RECORD.MASTERCHEF_STORAGE),
                txb.object(OBJECT_RECORD.MASTERCHEF_BALANCE),
                txb.object(OBJECT_RECORD.MASTERCHEF_ACCOUNT_STORAGE),
                txb.object(OBJECT_RECORD.IPX_STORAGE),
                txb.object(OBJECT_RECORD.CLOCK_OBJECT),
                coin,
            ],
            typeArguments: [],
        });
        txb.setGasBudget(300000000);
        const tx = await signAndExecuteTransactionBlock({
            transactionBlock: txb,
            requestType: "WaitForEffectsCert",
            options: { showEffects: true },
        });
        return tx;
    };

    const unstaking = async (amount) => {
        const txb = new TransactionBlock();
        console.log("Starting Staking");
        txb.moveCall({
            target: `${OBJECT_RECORD.PACKAGE_ID}::interface::unstake`,
            arguments: [
                txb.object(OBJECT_RECORD.MASTERCHEF_STORAGE),
                txb.object(OBJECT_RECORD.MASTERCHEF_BALANCE),
                txb.object(OBJECT_RECORD.MASTERCHEF_ACCOUNT_STORAGE),
                txb.object(OBJECT_RECORD.IPX_STORAGE),
                txb.object(OBJECT_RECORD.CLOCK_OBJECT),
                txb.pure(amount),
            ],
            typeArguments: [],
        });
        txb.setGasBudget(300000000);
        const tx = await signAndExecuteTransactionBlock({
            transactionBlock: txb,
            requestType: "WaitForEffectsCert",
            options: { showEffects: true },
        });
        return tx;
    };
    return { staking, unstaking };
}


export const useGetPoolInfo = (actionCount: number) => {
    const [data, setdata] = useState<{}>();
    useMemo(() => {
        const getPoolInfo = async () => {
            const txb = new TransactionBlock();
            txb.moveCall({
                target: `${OBJECT_RECORD.PACKAGE_ID}::master_chef::get_pool_info`,
                typeArguments: ["0x2::sui::SUI"],
                arguments: [
                    txb.object(OBJECT_RECORD.MASTERCHEF_STORAGE),
                ],
            });

            let provider = getProvider();
            const result = await provider.devInspectTransactionBlock({
                transactionBlock: txb,
                sender: OBJECT_RECORD.AddressZero,
            });

            const returnValues = result!["results"]![0]!["returnValues"];

            let allocationPoints = bcsForVersion(await provider.getRpcApiVersion()).de(
                returnValues![0]![1],
                Uint8Array.from(returnValues![0]![0])
            );

            let lastRewardTimeStamp = bcsForVersion(await provider.getRpcApiVersion()).de(
                returnValues![1]![1],
                Uint8Array.from(returnValues![1]![0])
            );

            let accruedIPXPerShare = bcsForVersion(await provider.getRpcApiVersion()).de(
                returnValues![2]![1],
                Uint8Array.from(returnValues![2]![0])
            );

            let balanceValue = bcsForVersion(await provider.getRpcApiVersion()).de(
                returnValues![3]![1],
                Uint8Array.from(returnValues![3]![0])
            );

            const results = {
                AllocationPoints: allocationPoints,
                LastRewardTimeStamp: lastRewardTimeStamp,
                AccruedIPXPerShare: accruedIPXPerShare,
                BalanceValue: BigNumber(balanceValue).dividedBy(LAMPORT).toFixed(3),
            }
            setdata(results)
        }
        getPoolInfo();
    }, [actionCount])
    return data;
};