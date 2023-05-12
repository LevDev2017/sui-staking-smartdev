import React from "react";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { ConnectButton, useWalletKit } from "@mysten/wallet-kit";

import { Layout } from "../components/layouts/layout";
import { OBJECT_RECORD, LAMPORT } from "../config";
import {
  useGetBalance,
  useGetFarm,
  useGetPendingRewards,
  useGetPoolInfo,
  useStakingMethods,
} from "../hooks";
import BigNumber from "bignumber.js";
import { convertTimestampToDateFormat } from "../utils";

interface POOLINFO {
  AllocationPoints?: string;
  LastRewardTimeStamp?: string;
  AccruedIPXPerShare?: string;
  BalanceValue?: string;
}

export const HomePage = () => {
  const { currentAccount } = useWalletKit();
  const { staking, unstaking } = useStakingMethods();
  const [unStake, setUnStake] = useState<any>(false);
  const [actionCount, setActionCount] = useState<number>(0);

  const initPool = {
    AllocationPoints: "",
    LastRewardTimeStamp: "",
    AccruedIPXPerShare: "",
    BalanceValue: "",
  };
  const [currentPoolInfo, setPoolInfo] = useState<POOLINFO>(initPool);

  // ---------- Get Farming details -----------
  const farmData = useGetFarm(
    OBJECT_RECORD.COIN_SUI,
    currentAccount?.address || OBJECT_RECORD.AddressZero,
    actionCount
  );
  // const accountBalance = farmData[0]?.accountBalance?.toString() || "0";
  const totalStakedAmount =
    farmData[0]?.accountBalance?.dividedBy(LAMPORT).toFixed(3) || "0";
  // const allocationPoints = farmData[0]?.allocationPoints?.dividedBy(LAMPORT).toFixed(3) || "0";

  // -------------------------------------------

  // ---------- Get Pending  details -----------
  const pendingRewards = useGetPendingRewards(
    currentAccount?.address || OBJECT_RECORD.AddressZero,
    actionCount
  );
  const pendingIPX = BigNumber(pendingRewards).dividedBy(LAMPORT).toFixed(3);
  // -------------------------------------------

  // ---------- Get Pending  details -----------
  const currentBalance = useGetBalance(
    currentAccount?.address || OBJECT_RECORD.AddressZero,
    actionCount
  );
  // -------------------------------------------

  // ---------- Get POOL INFO -----------
  const poolInfo = useGetPoolInfo(actionCount);
  useEffect(() => {
    if (poolInfo) {
      setPoolInfo(poolInfo);
    }
  }, [poolInfo]);
  // ------------------------------------

  const [address, setAddress] = useState<any>("");
  useEffect(() => {
    if (currentAccount?.address) {
      let tempAddr = currentAccount?.address;
      setAddress(tempAddr.slice(0, 4) + "..." + tempAddr.slice(-4));
    } else setAddress("");
  }, [currentAccount]);

  const [amount, setAmount] = useState<any>(0);
  const maxFunction = () => {
    if (unStake) {
      setAmount(totalStakedAmount);
    } else {
      setAmount(
        currentAccount?.address && parseFloat(currentBalance) > 0.3
          ? (parseFloat(currentBalance) - 0.3).toFixed(3)
          : 0
      );
    }
  };

  const handleStake = async (amount) => {
    let tx = await staking(amount);
    let status: string = tx!["effects"]!["status"]!["status"] || "failure";
    let error: string =
      tx!["effects"]!["status"]!["error"] ||
      "We are aorry. Please try later again.";

    if (status === "failure") {
      toast(error, {
        type: "error",
      });
    } else {
      toast("Staking success", {
        type: "success",
      });
      const newCount = actionCount + 1;
      setActionCount(newCount);
    }
  };

  const handleUnstake = async (amount) => {
    let tx = await unstaking(amount);

    let status: string = tx!["effects"]!["status"]!["status"] || "failure";
    let error: string =
      tx!["effects"]!["status"]!["error"] ||
      "We are aorry. Please try later again.";

    if (status === "failure") {
      toast(error, {
        type: "error",
      });
    } else {
      toast("UnStaking success", {
        type: "success",
      });
      const newCount = actionCount + 1;
      setActionCount(newCount);
    }
  };

  return (
    <Layout balance={currentBalance}>
      <div className="flex-1 flex flex-col gap-50 items-center">
        <div className="flex flex-row gap-20 flex-wrap justify-center">
          <div className="w-250 flex flex-col gap-5 mm:gap-10 lg:gap-15 bg-foreground px-10 mm:px-15 lg:px-20 py-10 mm:py-15 lg:py-20 rounded-md">
            <span className="text-10 mm:text-12 opacity-50">
              Total SUI Staked
            </span>
            <span className="text-15 mm:text-20 font-bold">
              {currentPoolInfo["BalanceValue"]
                ? currentPoolInfo["BalanceValue"] + " SUI"
                : "Loading ..."}
            </span>
            {/* <span className="text-12 mm:text-15 font-semibold">= $ 13.88M</span> */}
          </div>

          <div className="w-250 flex flex-col gap-5 mm:gap-10 lg:gap-15 bg-foreground px-10 mm:px-15 lg:px-20 py-10 mm:py-15 lg:py-20 rounded-md">
            <span className="text-10 mm:text-12 opacity-50">
              Last Reward Time
            </span>
            <span className="text-15 mm:text-20 font-bold">
              {currentPoolInfo["LastRewardTimeStamp"]
                ? convertTimestampToDateFormat(
                    currentPoolInfo["LastRewardTimeStamp"]
                  )
                : "Loading..."}
            </span>
            {/* <span className="text-12 mm:text-15 font-semibold">= $ 2.88</span> */}
          </div>

          <div className="w-250 flex flex-col gap-5 mm:gap-10 lg:gap-15 bg-foreground px-10 mm:px-15 lg:px-20 py-10 mm:py-15 lg:py-20 rounded-md">
            <span className="text-10 mm:text-12 opacity-50">
              Accrued token Per Share
            </span>
            <span className="text-15 mm:text-20 font-bold">
              {currentPoolInfo["AccruedIPXPerShare"]! || "Loading ..."}
            </span>
            {/* <span className="text-12 mm:text-15 font-semibold">= $ 2.88</span> */}
          </div>

          <div className="w-250 flex flex-col gap-5 mm:gap-10 lg:gap-15 bg-foreground px-10 mm:px-15 lg:px-20 py-10 mm:py-15 lg:py-20 rounded-md">
            <span className="text-10 mm:text-12 opacity-50">
              Allocation Points
            </span>
            <span className="text-15 mm:text-20 font-bold">
              {currentPoolInfo["AllocationPoints"]
                ? currentPoolInfo["AllocationPoints"] + " %"
                : "Loading ..."}
            </span>
            <span className="text-12 mm:text-15 font-semibold"></span>
          </div>
        </div>

        <div className="flex flex-col gap-30 items-center">
          <div className="flex flex-col items-center text-center">
            <span className="text-30 md:text-40 lg:text-50 font-bold">
              Stake Your SUI
            </span>
            <span className="text-12 md:text-15 lg:text-18 opacity-50">
              Stake SUI and receive SUI while earning staking rewards
            </span>
          </div>

          <div className="flex flex-row gap-5 p-5 bg-foreground rounded-full">
            <div
              onClick={() => {
                setUnStake(false);
              }}
              className={`w-100 md:w-120 lg:w-150 py-5 md:py-8 lg:py-10 ${
                !unStake && "bg-primary"
              } rounded-full text-center cursor-pointer switch-item`}
            >
              <span className="text-15 md:text-18 lg:text-20 font-semibold">
                Stake
              </span>
            </div>

            <div
              onClick={() => {
                setUnStake(true);
              }}
              className={`w-100 md:w-120 lg:w-150 py-5 md:py-8 lg:py-10 ${
                unStake && "bg-primary"
              } rounded-full text-center cursor-pointer switch-item`}
            >
              <span className="text-15 md:text-18 lg:text-20 font-semibold">
                Unstake
              </span>
            </div>
          </div>

          <div className="w-full max-w-500 flex flex-col gap-15 md:gap-18 lg:gap-20 px-15 md:px-18 lg:px-20 py-15 md:py-18 lg:py-20 bg-modalBg rounded-md">
            <div className="flex flex-col px-15 md:px-18 lg:px-20 py-10 md:py-12 lg:py-15 bg-foreground rounded-md">
              <div className="flex flex-row gap-10 justify-between items-center py-10 md:py-15 lg:py-20">
                <div className="flex flex-row gap-5 md:gap-10 items-center">
                  <div className="w-20 md:w-30 h-20 md:h-30 bg-white rounded-full" />
                  <span className="text-15 md:text-18 lg:text-20 font-semibold">
                    SUI
                  </span>
                </div>

                <div className="flex flex-row gap-10 items-center">
                  <span className="text-12 md:text-15 opacity-50">
                    SUI amount to stake
                  </span>

                  <span
                    className="text-15 md:text-18 lg:text-20 font-bold text-primary cursor-pointer"
                    onClick={maxFunction}
                  >
                    MAX
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-text py-5 md:py-8 lg:py-10">
                <div className="flex flex-row gap-10 text-12 md:text-15 opacity-50">
                  Amount:
                  <input
                    placeholder="0"
                    className="text-right"
                    type="number"
                    value={amount}
                    step={0.001}
                    onChange={(e) => {
                      let value = Number(e.target.value);
                      if (value > 0) {
                        setAmount(value);
                      } else setAmount(0);
                    }}
                  />
                  SUI
                </div>
              </div>
            </div>

            {!unStake && (
              <>
                {/* <div className="flex flex-row justify-between">
                  <span className="text-12 md:text-15 opacity-80">
                    You will receive
                  </span>
                  <span className="text-12 md:text-15 opacity-80">
                    0.000 SUI
                  </span>
                </div> */}

                {!!address && (
                  <div
                    onClick={() => {
                      handleStake(amount * LAMPORT);
                    }}
                    className="bg-primary px-10 py-10 md:py-15 rounded-lg text-center cursor-pointer text-12 md:text-15 font-semibold"
                  >
                    <span>Stake</span>
                  </div>
                )}
              </>
            )}

            {!!unStake && (
              <>
                <div className="grid grid-cols-2 gap-10 md:gap-15 lg:gap-20">
                  <div className="flex flex-col gap-10 md:gap-15 lg:gap-20 p-10 md:p-15 lg:p-20 bg-foreground rounded-md">
                    <div className="flex flex-col gap-5 md:gap-10">
                      <span className="text-12 md:text-13">Staked</span>
                      <ul className="item-list pl-20">
                        <li className="text-13 md:text-15">
                          <div className="flex flex-row gap-5 items-center">
                            <span className="text-10 md:text-12">
                              {totalStakedAmount}
                            </span>
                            SUI
                          </div>
                        </li>
                      </ul>
                    </div>

                    <span className="text-11 md:text-12 opacity-50">
                      Unstake fee: 0.05%
                    </span>
                  </div>

                  <div className="flex flex-col gap-10 md:gap-15 lg:gap-20 p-10 md:p-15 lg:p-20 bg-foreground rounded-md">
                    <div className="flex flex-col gap-5 md:gap-10">
                      <span className="text-12 md:text-13">Pending Reward</span>
                      <ul className="item-list pl-20">
                        <li className="text-13 md:text-15">
                          <div className="flex flex-row gap-5 items-center">
                            <span className="text-10 md:text-12">
                              {pendingIPX}
                            </span>
                            IPX
                          </div>
                        </li>
                      </ul>
                    </div>

                    <span className="text-11 md:text-12 opacity-50">
                      Unstake fee: 0
                    </span>
                  </div>
                </div>

                {!!address && (
                  <div
                    onClick={() => {
                      handleUnstake(amount * LAMPORT);
                    }}
                    className="bg-primary px-10 py-10 md:py-15 rounded-lg text-center cursor-pointer text-12 md:text-15 font-semibold"
                  >
                    <span>UnStake</span>
                  </div>
                )}
              </>
            )}

            {!address && (
              <ConnectButton
                connectedText={address}
                connectText={"Connect Wallet"}
                className="connect-btn px-10 py-10 md:py-15 rounded-lg text-center cursor-pointer text-12 md:text-15 font-semibold"
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
