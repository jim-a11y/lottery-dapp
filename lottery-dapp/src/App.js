import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import DiceGameABI from "./abis/Dicegame.json";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;


function App() {
  const [account, setAccount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [selectedBets, setSelectedBets] = useState([]);
  const [message, setMessage] = useState("");
  const [potentialPayout, setPotentialPayout] = useState(null);
  const [balance, setBalance] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [diceNumber, setDiceNumber] = useState(null);
  const [loading, setLoading] = useState(false);

  const provider = window.ethereum ? new BrowserProvider(window.ethereum) : null;

  const showMessage = (text, duration = 3000) => {
    setMessage(text);
    setTimeout(() => setMessage(""), duration);
  };

  const connectWallet = async () => {
    if (!provider) return alert("請安裝 MetaMask！");
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      showMessage("✅ 錢包已連接");
      fetchBalance(accounts[0]);
    } catch (err) {
      console.error(err);
      showMessage("❌ 錢包連接失敗");
    }
  };

  const disconnectWallet = () => {
    setAccount("");
    setBalance(null);
    showMessage("👋 錢包已斷開連接");
  };

  const fetchBalance = async (address) => {
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, DiceGameABI, signer);
      const bal = await contract.balances(address);
      setBalance(parseFloat(formatEther(bal)).toFixed(4));
    } catch (err) {
      console.error(err);
      showMessage("❌ 查詢餘額失敗");
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(depositAmount)) return showMessage("請輸入正確金額");

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, DiceGameABI, signer);
      const tx = await contract.deposit({ value: parseEther(depositAmount) });
      await tx.wait();
      showMessage(`✅ 成功儲值 ${depositAmount} ETH`);
      fetchBalance(account);
      setDepositAmount("");
    } catch (err) {
      console.error(err);
      showMessage("❌ 儲值失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!depositAmount || isNaN(depositAmount)) return showMessage("請輸入正確金額");

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, DiceGameABI, signer);
      const tx = await contract.withdraw(parseEther(depositAmount));
      await tx.wait();
      showMessage("✅ 提款成功");
      fetchBalance(account);
      setDepositAmount("");
    } catch (err) {
      console.error(err);
      showMessage("❌ 提款失敗");
    } finally {
      setLoading(false);
    }
  };

  const getBetOptions = () => ({
    red: selectedBets.includes("紅"),
    black: selectedBets.includes("黑"),
    big: selectedBets.includes("大"),
    small: selectedBets.includes("小"),
    odd: selectedBets.includes("單"),
    even: selectedBets.includes("雙"),
  });

  const handleBet = async () => {
    if (!betAmount || isNaN(betAmount)) return showMessage("請輸入正確下注金額");

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, DiceGameABI, signer);
      const options = getBetOptions();

      const tx = await contract.placeBet(
        parseEther(betAmount),
        options.red,
        options.black,
        options.big,
        options.small,
        options.odd,
        options.even
      );
      await tx.wait();
      showMessage("🎲 下注成功，開始擲骰...");

      // 骰子動畫
      setRolling(true);
      let rollInterval = setInterval(() => {
        setDiceNumber(Math.floor(Math.random() * 6) + 1);
      }, 100);

      contract.once("DiceRolled", (player, result, win, payout) => {
        if (player.toLowerCase() === account.toLowerCase()) {
          setTimeout(() => {
            clearInterval(rollInterval);
            setRolling(false);
            setDiceNumber(result);

            if (win) {
              showMessage(`🎉 擲出 ${result} 點，贏得 ${formatEther(payout)} ETH`);
            } else {
              showMessage(`😢 擲出 ${result} 點，沒有中獎`);
            }
            fetchBalance(account);
          }, 2000);
        }
      });
    } catch (err) {
      console.error(err);
      showMessage("❌ 下注失敗");
    } finally {
      setLoading(false);
    }
  };

  const previewPayout = async () => {
    if (!betAmount || isNaN(betAmount)) return showMessage("請輸入正確下注金額");

    try {
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, DiceGameABI, signer);
      const options = getBetOptions();

      const payout = await contract.getPotentialPayout(
        parseEther(betAmount),
        options.red,
        options.black,
        options.big,
        options.small,
        options.odd,
        options.even
      );
      setPotentialPayout(parseFloat(formatEther(payout)).toFixed(4));
    } catch (err) {
      console.error(err);
      showMessage("❌ 預覽失敗");
    }
  };

  const toggleBetOption = (option) => {
    const mutuallyExclusive = { 紅: "黑", 黑: "紅", 大: "小", 小: "大", 單: "雙", 雙: "單" };
    setSelectedBets((prev) => {
      let updated = [...prev];
      if (updated.includes(option)) return updated.filter((item) => item !== option);
      const opposite = mutuallyExclusive[option];
      if (opposite && updated.includes(opposite)) {
        updated = updated.filter((item) => item !== opposite);
      }
      updated.push(option);
      return updated;
    });
  };

  return (
    <div className="container text-center mt-5">
      <h1 className="text-primary">🎲 擲骰 DApp</h1>

      {account ? (
        <>
          <div className="mt-3">
            <span className="me-2 text-success">已連接: {account.slice(0, 6)}...{account.slice(-4)}</span>
            <button className="btn btn-outline-danger btn-sm" onClick={disconnectWallet}>取消連接</button>
          </div>
          <div className="mt-2">餘額: {balance !== null ? <strong>{balance} ETH</strong> : "讀取中..."}</div>
        </>
      ) : (
        <button className="btn btn-success mt-3" onClick={connectWallet}>連接錢包</button>
      )}

      {message && <div className="alert alert-info mt-3">{message}</div>}
      {loading && <div className="spinner-border text-primary mt-3" role="status"></div>}

      {/* 儲值/提款 */}
      <div className="mt-4">
        <input
          type="number"
          step="0.0001"
          placeholder="儲值/提款金額 (ETH)"
          className="form-control my-2"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          disabled={loading}
        />
        <button className="btn btn-primary" onClick={handleDeposit} disabled={loading}>儲值</button>
        <button className="btn btn-warning mx-2" onClick={handleWithdraw} disabled={loading}>提款</button>
      </div>

      {/* 下注 */}
      <div className="mt-4">
        <input
          type="number"
          step="0.0001"
          placeholder="下注金額 (ETH)"
          className="form-control my-2"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          disabled={loading}
        />
        <div className="my-2">
          {["紅", "黑", "大", "小", "單", "雙"].map((option) => (
            <button
              key={option}
              className={`btn m-1 ${selectedBets.includes(option) ? "btn-warning" : "btn-outline-warning"}`}
              onClick={() => toggleBetOption(option)}
              disabled={loading}
            >
              {option}
            </button>
          ))}
        </div>
        <button className="btn btn-danger" onClick={handleBet} disabled={loading}>開始擲骰</button>
        <button className="btn btn-info ms-2" onClick={previewPayout} disabled={loading}>預覽可贏金額</button>
        {potentialPayout !== null && (
          <div className="mt-3 text-success">🎯 預期獎金：<strong>{potentialPayout} ETH</strong></div>
        )}
      </div>

      {/* 骰子動畫 */}
      <div className="mt-5">
        {diceNumber && (
          <div
            style={{
              fontSize: "80px",
              width: "100px",
              height: "100px",
              lineHeight: "100px",
              margin: "0 auto",
              border: "5px solid black",
              borderRadius: "20px",
              backgroundColor: "#fff",
            }}
          >
            {diceNumber}
          </div>
        )}
        {rolling && <div className="text-warning mt-2">🎲 擲骰中...</div>}
      </div>
    </div>
  );
}

export default App;