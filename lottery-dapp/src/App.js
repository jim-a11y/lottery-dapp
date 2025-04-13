import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserProvider, Contract, parseEther } from "ethers";

const CONTRACT_ADDRESS = "0x358AA13c52544ECCEF6B0ADD0f801012ADAD5eE3";
const CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: "payable",
    type: "function",
    name: "deposit",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bool", name: "red", type: "bool" },
      { internalType: "bool", name: "black", type: "bool" },
      { internalType: "bool", name: "big", type: "bool" },
      { internalType: "bool", name: "small", type: "bool" },
      { internalType: "bool", name: "odd", type: "bool" },
      { internalType: "bool", name: "even", type: "bool" },
    ],
    name: "placeBet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

function App() {
  const [account, setAccount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [selectedBets, setSelectedBets] = useState([]);
  const [message, setMessage] = useState("");

  const showMessage = (text, duration = 2000) => {
    setMessage(text);
    setTimeout(() => setMessage(""), duration);
  };

  const connectWallet = async () => {
    if (!window.ethereum) return alert("請安裝 MetaMask！");
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
    showMessage("✅ 錢包已連接");
  };

  const disconnectWallet = () => {
    setAccount("");
    showMessage("👋 錢包已斷開連接");
  };

  const handleDeposit = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.deposit({ value: parseEther(depositAmount) });
      await tx.wait();
      showMessage(`✅ 成功儲值 ${depositAmount} ETH`);
    } catch (err) {
      console.error(err);
      showMessage("❌ 儲值失敗");
    }
  };

  const handleWithdraw = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.withdraw(parseEther(depositAmount));
      await tx.wait();
      showMessage("✅ 提款成功");
    } catch (err) {
      console.error(err);
      showMessage("❌ 提款失敗");
    }
  };

  const handleBet = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const options = {
        red: selectedBets.includes("紅"),
        black: selectedBets.includes("黑"),
        big: selectedBets.includes("大"),
        small: selectedBets.includes("小"),
        odd: selectedBets.includes("單"),
        even: selectedBets.includes("雙"),
      };

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
      showMessage("🎲 下注成功！");
    } catch (err) {
      console.error(err);
      showMessage("❌ 下注失敗");
    }
  };

  const toggleBetOption = (option) => {
    const mutuallyExclusive = {
      紅: "黑",
      黑: "紅",
      大: "小",
      小: "大",
      單: "雙",
      雙: "單",
    };

    setSelectedBets((prev) => {
      let updated = [...prev];
      if (updated.includes(option)) {
        return updated.filter((item) => item !== option);
      }
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
      <h1 className="text-primary">🎲 樂透 DApp</h1>

      {account ? (
        <div className="mt-3">
          <span className="me-2 text-success">
            已連接: {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          <button className="btn btn-outline-danger btn-sm" onClick={disconnectWallet}>
            取消連接
          </button>
        </div>
      ) : (
        <button className="btn btn-success mt-3" onClick={connectWallet}>
          連接錢包
        </button>
      )}

      {message && <div className="alert alert-info mt-3 fade show">{message}</div>}

      <div className="mt-4">
        <input
          type="number"
          placeholder="儲值金額 (ETH)"
          className="form-control my-2"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleDeposit}>儲值</button>
        <button className="btn btn-warning mx-2" onClick={handleWithdraw}>提款</button>
      </div>

      <div className="mt-4">
        <input
          type="number"
          placeholder="下注金額 (ETH)"
          className="form-control my-2"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
        />
        <div className="my-2">
          {["紅", "黑", "大", "小", "單", "雙"].map((option) => (
            <button
              key={option}
              className={`btn m-1 ${
                selectedBets.includes(option) ? "btn-warning" : "btn-outline-warning"
              }`}
              onClick={() => toggleBetOption(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <button className="btn btn-danger" onClick={handleBet}>開始擲骰</button>
      </div>
    </div>
  );
}

export default App;
