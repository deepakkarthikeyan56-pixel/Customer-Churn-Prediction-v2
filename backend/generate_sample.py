import numpy as np
import pandas as pd
import random
import os

np.random.seed(42)
random.seed(42)

n_samples = 2000

genders = ['Male', 'Female']
yes_no = ['Yes', 'No']
internet_services = ['DSL', 'Fiber optic', 'No']
contracts = ['Month-to-month', 'One year', 'Two year']
payment_methods = [
    'Electronic check',
    'Mailed check',
    'Bank transfer (automatic)',
    'Credit card (automatic)'
]

records = []
for i in range(1, n_samples + 1):
    cid = f"{random.randint(1000, 9999)}-{''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=5))}"
    gender = random.choice(genders)
    senior = 1 if random.random() < 0.16 else 0
    partner = random.choice(yes_no)
    dependents = 'Yes' if partner == 'Yes' and random.random() < 0.5 else 'No'
    
    contract = np.random.choice(contracts, p=[0.55, 0.24, 0.21])
    
    if contract == 'Month-to-month':
        tenure = int(np.clip(np.random.exponential(scale=14), 1, 72))
    elif contract == 'One year':
        tenure = int(np.clip(np.random.normal(loc=35, scale=12), 1, 72))
    else:
        tenure = int(np.clip(np.random.normal(loc=55, scale=10), 12, 72))
        
    phone = 'Yes' if random.random() < 0.9 else 'No'
    mult_lines = random.choice(['Yes', 'No']) if phone == 'Yes' else 'No phone service'
    
    internet = np.random.choice(internet_services, p=[0.34, 0.44, 0.22])
    if internet != 'No':
        sec = random.choice(['Yes', 'No'])
        backup = random.choice(['Yes', 'No'])
        device = random.choice(['Yes', 'No'])
        support = random.choice(['Yes', 'No'])
        tv = random.choice(['Yes', 'No'])
        movies = random.choice(['Yes', 'No'])
    else:
        sec = backup = device = support = tv = movies = 'No internet service'
        
    paperless = 'Yes' if random.random() < 0.6 else 'No'
    pay_method = random.choice(payment_methods)
    
    # Calculate monthly charges based on services
    base = 20.0
    if phone == 'Yes': base += 10.0
    if mult_lines == 'Yes': base += 5.0
    if internet == 'DSL': base += 25.0
    elif internet == 'Fiber optic': base += 45.0
    if sec == 'Yes': base += 5.0
    if backup == 'Yes': base += 5.0
    if device == 'Yes': base += 5.0
    if support == 'Yes': base += 5.0
    if tv == 'Yes': base += 8.0
    if movies == 'Yes': base += 8.0
    
    monthly_charges = round(base + random.uniform(-2, 3), 2)
    total_charges = round(monthly_charges * tenure + random.uniform(-10, 10), 2)
    if total_charges < 0: total_charges = monthly_charges
    
    # Churn probability logic reflecting realistic customer behavior:
    churn_score = 0.0
    if contract == 'Month-to-month': churn_score += 0.35
    elif contract == 'One year': churn_score += 0.08
    else: churn_score -= 0.15
    
    if internet == 'Fiber optic': churn_score += 0.18
    if support == 'No': churn_score += 0.12
    if sec == 'No': churn_score += 0.10
    if pay_method == 'Electronic check': churn_score += 0.15
    if tenure <= 12: churn_score += 0.20
    elif tenure > 48: churn_score -= 0.25
    if senior == 1: churn_score += 0.08
    if monthly_charges > 80: churn_score += 0.10
    
    prob = 1 / (1 + np.exp(-3 * (churn_score - 0.35)))
    prob = np.clip(prob + np.random.normal(0, 0.05), 0.02, 0.98)
    
    churn = 'Yes' if random.random() < prob else 'No'
    
    records.append({
        'customerID': cid,
        'gender': gender,
        'SeniorCitizen': senior,
        'Partner': partner,
        'Dependents': dependents,
        'tenure': tenure,
        'PhoneService': phone,
        'MultipleLines': mult_lines,
        'InternetService': internet,
        'OnlineSecurity': sec,
        'OnlineBackup': backup,
        'DeviceProtection': device,
        'TechSupport': support,
        'StreamingTV': tv,
        'StreamingMovies': movies,
        'Contract': contract,
        'PaperlessBilling': paperless,
        'PaymentMethod': pay_method,
        'MonthlyCharges': monthly_charges,
        'TotalCharges': total_charges,
        'Churn': churn
    })

df = pd.DataFrame(records)
df.loc[random.sample(range(n_samples), 5), 'TotalCharges'] = np.nan

out_path = r"C:\Users\Deepak karthikeyan\.gemini\antigravity\scratch\customer-churn-app\backend\sample_data\telco_customer_churn.csv"
os.makedirs(os.path.dirname(out_path), exist_ok=True)
df.to_csv(out_path, index=False)
print(f"Generated {len(df)} records at {out_path}")
print(f"Churn rate: {(df['Churn'] == 'Yes').mean():.2%}")
