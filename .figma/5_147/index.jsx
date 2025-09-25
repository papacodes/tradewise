import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.depth1Frame0}>
      <div className={styles.depth2Frame0}>
        <div className={styles.depth3Frame0}>
          <img
            src="../image/mfy4mue0-kzdhsvz.svg"
            className={styles.depth5Frame0}
          />
          <p className={styles.tradeTrackr}>TradeTrackr</p>
        </div>
        <div className={styles.depth3Frame1}>
          <div className={styles.depth4Frame0}>
            <p className={styles.dashboard}>Dashboard</p>
            <p className={styles.dashboard}>Trades</p>
            <p className={styles.dashboard}>Analytics</p>
            <p className={styles.dashboard}>Settings</p>
          </div>
          <img
            src="../image/mfy4mue5-ptjs09k.png"
            className={styles.depth4Frame1}
          />
        </div>
      </div>
      <div className={styles.depth3Frame02}>
        <div className={styles.depth5Frame02}>
          <p className={styles.dashboard2}>Dashboard</p>
          <p className={styles.trackYourTradingPerf}>
            Track your trading performance and insights
          </p>
        </div>
        <div className={styles.depth4Frame12}>
          <div className={styles.depth5Frame03}>
            <p className={styles.totalTrades}>Total Trades</p>
            <p className={styles.a125}>125</p>
            <p className={styles.a10}>+10%</p>
          </div>
          <div className={styles.depth5Frame1}>
            <p className={styles.totalTrades}>Current P/L</p>
            <p className={styles.a125}>$2,500</p>
            <p className={styles.a5}>-5%</p>
          </div>
          <div className={styles.depth5Frame03}>
            <p className={styles.totalTrades}>Cumulative P/L</p>
            <p className={styles.a125}>$15,000</p>
            <p className={styles.a10}>+20%</p>
          </div>
        </div>
        <div className={styles.depth4Frame2}>
          <div className={styles.depth5Frame04}>
            <p className={styles.totalTrades}>Profit/Loss Over Time</p>
            <p className={styles.a15000}>$15,000</p>
            <div className={styles.depth6Frame2}>
              <p className={styles.last3Months}>Last 3 Months</p>
              <p className={styles.a20}>+20%</p>
            </div>
            <div className={styles.depth6Frame3}>
              <img
                src="../image/mfy4mue0-i9dldg1.svg"
                className={styles.depth7Frame0}
              />
              <div className={styles.depth7Frame1}>
                <p className={styles.jan}>Jan</p>
                <p className={styles.jan}>Feb</p>
                <p className={styles.jan}>Mar</p>
              </div>
            </div>
          </div>
          <div className={styles.depth5Frame12}>
            <p className={styles.totalTrades}>Trade Outcomes</p>
            <p className={styles.a15000}>125 Trades</p>
            <div className={styles.depth6Frame2}>
              <p className={styles.last3Months}>Last Month</p>
              <p className={styles.a20}>+10%</p>
            </div>
            <div className={styles.depth6Frame32}>
              <div className={styles.depth7Frame02}>
                <div className={styles.depth8Frame0} />
                <p className={styles.jan}>Win</p>
              </div>
              <div className={styles.depth7Frame02}>
                <div className={styles.depth8Frame0} />
                <p className={styles.jan}>Loss</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Component;
