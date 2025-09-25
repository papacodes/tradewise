import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.depth1Frame0}>
      <div className={styles.depth2Frame0}>
        <div className={styles.depth3Frame0}>
          <img
            src="../image/mfy2eblv-s5pgjmq.svg"
            className={styles.depth5Frame0}
          />
          <p className={styles.tradeWise}>TradeWise</p>
        </div>
        <div className={styles.depth3Frame1}>
          <div className={styles.depth4Frame0}>
            <p className={styles.home}>Home</p>
            <p className={styles.home}>Features</p>
            <p className={styles.home}>Pricing</p>
            <p className={styles.home}>Support</p>
          </div>
          <div className={styles.depth5Frame02}>
            <p className={styles.getStarted}>Get Started</p>
          </div>
        </div>
      </div>
      <div className={styles.depth3Frame02}>
        <p className={styles.welcomeToTradeWise}>Welcome to TradeWise</p>
        <p className={styles.trackYourTradesAnaly}>
          Track your trades, analyze your performance, and improve your trading
          strategy with TradeWise.
        </p>
        <div className={styles.depth5Frame03}>
          <div className={styles.depth6Frame0}>
            <p className={styles.email}>Email</p>
          </div>
        </div>
        <div className={styles.depth5Frame03}>
          <div className={styles.depth6Frame0}>
            <p className={styles.email}>Password</p>
          </div>
        </div>
        <div className={styles.depth4Frame4}>
          <div className={styles.depth6Frame02}>
            <p className={styles.logIn}>Log In</p>
          </div>
        </div>
        <p className={styles.donTHaveAnAccountSig}>
          Don't have an account? Sign up
        </p>
      </div>
    </div>
  );
}

export default Component;
