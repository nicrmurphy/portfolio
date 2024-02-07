import { For, createSignal } from "solid-js";

type asset = { symbol: string; target: number; value: number; allocation: number; deposit: number; offset?: number };

function DepositAllocation() {
  const [depositAmount, setDepositAmount] = createSignal<number>(0);
  const [portfolioData, setPortfolioData] = createSignal<asset[]>([
    { symbol: "BLV", target: 0.2, allocation: 0, deposit: 0, value: 0 },
    { symbol: "BSV", target: 0.2, allocation: 0, deposit: 0, value: 0 },
    { symbol: "VBR", target: 0.2, allocation: 0, deposit: 0, value: 0 },
    { symbol: "VTI", target: 0.2, allocation: 0, deposit: 0, value: 0 },
    { symbol: "IAUM", target: 0.2, allocation: 0, deposit: 0, value: 0 },
  ]);

  const calculateDepositAllocation = () => {
    let deposit = depositAmount();
    const totalPortfolioValue = getTotalPortfolioValue() + deposit;
    calculateAllocation();
    sortPortfolio();
    console.table(portfolioData());
    console.log("Total Portfolio Value:", totalPortfolioValue);

    let i = 0;
    while (deposit > 0.01 * portfolioData().length && i < portfolioData().length) {
      const lowestStock = portfolioData()[i];
      const nextLowestStock = portfolioData()[i + 1];
      console.log(lowestStock, nextLowestStock);
      const depositNeededForTarget = getDepositValue(lowestStock, lowestStock.target - Math.max(0, nextLowestStock?.offset ?? 0));
      console.log(
        `Remaining deposit: ${deposit}, Deposit needed x${i + 1}: ${depositNeededForTarget} (${depositNeededForTarget * (i + 1)})`,
      );

      const depositValue = toCurrency(Math.min(deposit, depositNeededForTarget * (i + 1)) / (i + 1));

      for (let n = 0; n < i + 1; n++) depositIntoStock(n, depositValue);

      console.table(portfolioData());

      i++;
    }

    console.log(`Remaining deposit: ${deposit}`);
    const portfolioDepositsTotal = toCurrency(portfolioData().reduce((total, stock) => (total += stock.deposit ?? 0), 0));
    console.log(`Total Deposit: ${depositAmount()} | ${portfolioDepositsTotal + deposit}`);
    if (depositAmount() !== portfolioDepositsTotal + deposit) console.error("*** Error: Deposit totals do not match");
    console.log(`Portfolio Total: ${totalPortfolioValue} | ${toCurrency(getTotalPortfolioValue() + deposit)}`);
    if (totalPortfolioValue !== toCurrency(getTotalPortfolioValue() + deposit)) console.error("*** Error: Portfolio totals do not match");

    const temp = portfolioData();
    setPortfolioData([]);
    setPortfolioData(temp);

    function calculateAllocation() {
      portfolioData().forEach((stock: asset) => (stock.allocation = toPercentage(stock.value / totalPortfolioValue)));
      portfolioData().forEach((stock: asset) => (stock.offset = toPercentage(stock.target - stock.allocation)));
    }

    function getTotalPortfolioValue() {
      return portfolioData().reduce((acc, cur) => acc + cur.value, 0);
    }

    function sortPortfolio() {
      setPortfolioData((data) => data.sort((a, b) => b.target - b.allocation - (a.target - a.allocation)));
    }

    function getStockFurthestFromTarget() {
      return portfolioData().reduce(
        (furthest, cur) => (cur.target - cur.allocation > furthest.target - furthest.allocation ? cur : furthest),
        portfolioData()[0],
      );
    }

    function getDepositValue(stock: asset, target: number) {
      return toCurrency(target * totalPortfolioValue - stock.value);
    }

    function depositIntoStock(assetIndex: number, depositValue: number) {
      const stock = portfolioData()[assetIndex];
      if (!stock.deposit) stock.deposit = 0;
      console.log(`Depositing ${depositValue} into ${stock.symbol} (${stock.deposit})`);

      stock.deposit = toCurrency(stock.deposit + depositValue);
      stock.value = toCurrency(stock.value + depositValue);

      setPortfolioData((data) => {
        data[assetIndex] = stock;
        return data;
      });

      deposit = toCurrency(deposit - depositValue);
      calculateAllocation();
    }

    function toCurrency(val: number) {
      return Math.round(val * 100) / 100;
    }

    function toPercentage(val: number) {
      return val;
      // return Math.floor(val * 1_000_000) / 1_000_000
    }
  };

  return (
    <>
      <div>
        Deposit: <input value={depositAmount()} onChange={(e) => setDepositAmount(parseFloat(e.target.value))} />
        <button onClick={calculateDepositAllocation}>Calculate</button>
        <For each={portfolioData()}>
          {(asset, i) => (
            <div>
              <input
                value={asset.symbol}
                onChange={(e) =>
                  setPortfolioData((data) => {
                    data[i()].symbol = e.target.value;
                    return data;
                  })
                }
              />
              <input
                value={asset.value}
                onChange={(e) =>
                  setPortfolioData((data) => {
                    data[i()].value = parseFloat(e.target.value);
                    return data;
                  })
                }
              />
              <input disabled value={asset.deposit} />
              <input disabled value={asset.allocation} />
              <input disabled value={asset.offset} />
            </div>
          )}
        </For>
      </div>
    </>
  );
}

export default DepositAllocation;
