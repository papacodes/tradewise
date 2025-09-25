import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.depth2Frame0}>
      <div className={styles.depth5Frame0}>
        <p className={styles.tradingJournal}>Trading Journal</p>
        <div className={styles.depth6Frame1}>
          <div className={styles.depth7Frame0}>
            <img
              src="../image/mfy4mum4-3py46rn.svg"
              className={styles.depth9Frame0}
            />
            <p className={styles.dashboard}>Dashboard</p>
          </div>
          <div className={styles.depth7Frame0}>
            <img
              src="../image/mfy4mum4-6822dxc.svg"
              className={styles.depth9Frame0}
            />
            <p className={styles.dashboard}>Journal</p>
          </div>
          <div className={styles.depth7Frame0}>
            <img
              src="../image/mfy4mum4-o9j3zlk.svg"
              className={styles.depth9Frame0}
            />
            <p className={styles.dashboard}>Analytics</p>
          </div>
          <div className={styles.depth7Frame3}>
            <img
              src="../image/mfy4mum4-5crvcqg.svg"
              className={styles.depth9Frame0}
            />
            <p className={styles.dashboard}>Accounts</p>
          </div>
          <div className={styles.depth7Frame0}>
            <img
              src="../image/mfy4mum4-9wimdoh.svg"
              className={styles.depth9Frame0}
            />
            <p className={styles.dashboard}>Settings</p>
          </div>
        </div>
      </div>
      <div className={styles.depth3Frame1}>
        <div className={styles.depth4Frame0}>
          <p className={styles.accounts}>Accounts</p>
          <div className={styles.depth6Frame0}>
            <p className={styles.newAccount}>New Account</p>
          </div>
        </div>
        <div className={styles.depth4Frame1}>
          <div className={styles.depth6Frame02}>
            <div className={styles.depth8Frame0}>
              <p className={styles.account}>Account</p>
              <p className={styles.balance}>Balance</p>
              <p className={styles.currency}>Currency</p>
              <p className={styles.actions}>Actions</p>
            </div>
            <div className={styles.depth7Frame1}>
              <div className={styles.depth8Frame02}>
                <p className={styles.tradingAccount1}>Trading Account 1</p>
                <p className={styles.a10000}>$10,000</p>
                <p className={styles.uSd}>USD</p>
                <p className={styles.view}>View</p>
              </div>
              <div className={styles.depth8Frame02}>
                <p className={styles.tradingAccount1}>Trading Account 2</p>
                <p className={styles.a10000}>€5,000</p>
                <p className={styles.uSd}>EUR</p>
                <p className={styles.view}>View</p>
              </div>
              <div className={styles.depth8Frame02}>
                <p className={styles.tradingAccount1}>Trading Account 3</p>
                <p className={styles.a10000}>£2,000</p>
                <p className={styles.uSd}>GBP</p>
                <p className={styles.view}>View</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Component;
