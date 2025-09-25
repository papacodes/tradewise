import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.depth2Frame0}>
      <div className={styles.depth4Frame0}>
        <div className={styles.depth5Frame0}>
          <p className={styles.tradeWise}>TradeWise</p>
          <div className={styles.depth6Frame1}>
            <div className={styles.depth7Frame0}>
              <img
                src="../image/mfy4munu-tvoi7ro.svg"
                className={styles.depth9Frame0}
              />
              <p className={styles.dashboard}>Dashboard</p>
            </div>
            <div className={styles.depth7Frame0}>
              <img
                src="../image/mfy4munu-m9lbycg.svg"
                className={styles.depth9Frame0}
              />
              <p className={styles.dashboard}>Trades</p>
            </div>
            <div className={styles.depth7Frame2}>
              <img
                src="../image/mfy4munu-hfzveju.svg"
                className={styles.depth9Frame0}
              />
              <p className={styles.dashboard}>Analytics</p>
            </div>
            <div className={styles.depth7Frame0}>
              <img
                src="../image/mfy4munu-9n22ltn.svg"
                className={styles.depth9Frame0}
              />
              <p className={styles.dashboard}>Settings</p>
            </div>
            <div className={styles.depth7Frame0}>
              <img
                src="../image/mfy4munu-56121eq.svg"
                className={styles.depth9Frame0}
              />
              <p className={styles.dashboard}>Help</p>
            </div>
          </div>
        </div>
        <div className={styles.depth7Frame0}>
          <img
            src="../image/mfy4munu-duxe2tv.svg"
            className={styles.depth9Frame0}
          />
          <p className={styles.dashboard}>Logout</p>
        </div>
      </div>
      <div className={styles.depth3Frame1}>
        <p className={styles.analytics}>Analytics</p>
        <p className={styles.performanceOverview}>Performance Overview</p>
        <div className={styles.depth4Frame2}>
          <div className={styles.depth5Frame02}>
            <p className={styles.tradeWise}>Profit Over Time</p>
            <p className={styles.a12500}>$12,500</p>
            <div className={styles.depth6Frame2}>
              <p className={styles.last30Days}>Last 30 Days</p>
              <p className={styles.a15}>+15%</p>
            </div>
            <div className={styles.depth6Frame3}>
              <img
                src="../image/mfy4munu-dnhrw3q.svg"
                className={styles.depth7Frame02}
              />
              <div className={styles.depth7Frame1}>
                <p className={styles.day1}>Day 1</p>
                <p className={styles.day1}>Day 5</p>
                <p className={styles.day1}>Day 10</p>
                <p className={styles.day1}>Day 15</p>
                <p className={styles.day1}>Day 20</p>
                <p className={styles.day1}>Day 25</p>
                <p className={styles.day1}>Day 30</p>
              </div>
            </div>
          </div>
        </div>
        <p className={styles.performanceOverview}>Trading Insights</p>
        <div className={styles.depth4Frame4}>
          <div className={styles.depth5Frame03}>
            <p className={styles.tradeWise}>Most Profitable Sessions</p>
            <p className={styles.a12500}>$3,200</p>
            <div className={styles.depth6Frame2}>
              <p className={styles.last30Days}>Last 30 Days</p>
              <p className={styles.a15}>+20%</p>
            </div>
            <div className={styles.depth6Frame32}>
              <div className={styles.depth7Frame03}>
                <p className={styles.sessionA}>Session A</p>
                <div className={styles.depth9Frame02} />
              </div>
              <div className={styles.depth7Frame12}>
                <p className={styles.sessionB}>Session B</p>
                <div className={styles.depth8Frame1}>
                  <div className={styles.depth9Frame03} />
                </div>
              </div>
              <div className={styles.depth7Frame22}>
                <p className={styles.sessionB}>Session C</p>
                <div className={styles.depth8Frame12}>
                  <div className={styles.depth9Frame04} />
                </div>
              </div>
            </div>
          </div>
          <div className={styles.depth5Frame1}>
            <p className={styles.tradeWise}>Favorite Trading Sessions</p>
            <p className={styles.a12500}>15</p>
            <div className={styles.depth6Frame2}>
              <p className={styles.last30Days}>Last 30 Days</p>
              <p className={styles.a15}>+10%</p>
            </div>
            <div className={styles.depth6Frame33}>
              <div className={styles.depth7Frame04}>
                <p className={styles.sessionA}>Session A</p>
                <div className={styles.depth8Frame1}>
                  <div className={styles.depth9Frame03} />
                </div>
              </div>
              <div className={styles.depth7Frame13}>
                <p className={styles.sessionB}>Session B</p>
                <div className={styles.depth8Frame13}>
                  <div className={styles.depth9Frame05} />
                </div>
              </div>
              <div className={styles.depth7Frame23}>
                <p className={styles.sessionB}>Session C</p>
                <div className={styles.depth8Frame14}>
                  <div className={styles.depth9Frame06} />
                </div>
              </div>
            </div>
          </div>
          <div className={styles.depth5Frame2}>
            <p className={styles.tradeWise}>Win/Loss Ratio</p>
            <p className={styles.a12500}>2:1</p>
            <div className={styles.depth6Frame2}>
              <p className={styles.last30Days}>Overall</p>
              <p className={styles.a15}>+5%</p>
            </div>
            <div className={styles.depth6Frame34}>
              <div className={styles.depth7Frame05}>
                <div className={styles.depth8Frame0} />
                <p className={styles.day1}>Wins</p>
              </div>
              <div className={styles.depth7Frame05}>
                <div className={styles.depth8Frame0} />
                <p className={styles.day1}>Losses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Component;
