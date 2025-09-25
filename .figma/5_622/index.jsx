import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.depth1Frame0}>
      <div className={styles.depth2Frame0}>
        <div className={styles.depth3Frame0}>
          <img
            src="../image/mfy4mupb-4mk1qt0.svg"
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
            <p className={styles.logIn}>Log In</p>
          </div>
        </div>
      </div>
      <div className={styles.depth3Frame02}>
        <p className={styles.createYourAccount}>Create your account</p>
        <div className={styles.depth5Frame03}>
          <p className={styles.username}>Username</p>
          <div className={styles.depth6Frame1}>
            <p className={styles.enterYourUsername}>
              Enter&nbsp;&nbsp;your username
            </p>
          </div>
        </div>
        <div className={styles.depth5Frame03}>
          <p className={styles.username}>Email</p>
          <div className={styles.depth6Frame1}>
            <p className={styles.enterYourUsername}>Enter&nbsp;&nbsp;your email</p>
          </div>
        </div>
        <div className={styles.depth5Frame03}>
          <p className={styles.username}>Password</p>
          <div className={styles.depth6Frame1}>
            <p className={styles.enterYourUsername}>
              Enter&nbsp;&nbsp;your password
            </p>
          </div>
        </div>
        <div className={styles.depth5Frame03}>
          <p className={styles.username}>Confirm Password</p>
          <div className={styles.depth6Frame1}>
            <p className={styles.enterYourUsername}>
              Confirm&nbsp;&nbsp;your password
            </p>
          </div>
        </div>
        <div className={styles.depth4Frame5}>
          <div className={styles.depth6Frame0}>
            <p className={styles.logIn}>Sign Up</p>
          </div>
        </div>
        <p className={styles.alreadyHaveAnAccount}>
          Already have an account? Log in
        </p>
      </div>
    </div>
  );
}

export default Component;
