import glob
import joblib
import os
import pandas as pd
from app.ml.preprocessing import ChurnPreprocessor

models = glob.glob('trained_models/*.joblib')
print('Found models:', len(models))
if models:
    for m in models[-4:]:
        pkg = joblib.load(m)
        clf = pkg['classifier']
        prep = pkg['preprocessor']
        algo = pkg['algorithm_name']
        print(f"\n--- Testing Model: {algo} ---")
        
        df = pd.read_csv('sample_data/telco_customer_churn.csv')
        for i in [0, 1, 2, 3, 4, 5, 10, 15, 20, 25]:
            row = df.iloc[i].to_dict()
            trans = prep.transform_single_input(row)
            prob = clf.predict_proba(trans)[0]
            cid = row.get('customerID', f'Cust-{i}')
            churn_val = row.get('Churn')
            contract = row.get('Contract')
            tenure = row.get('tenure')
            charges = row.get('MonthlyCharges')
            print(f"Customer {cid} | Contract={contract:<14} | Tenure={tenure:<2} | Monthly=${charges:<5} | Real={churn_val} -> Churn Prob={prob[1]*100:.1f}%")
