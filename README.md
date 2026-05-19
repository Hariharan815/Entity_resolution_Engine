**Entity Resolution Engine**
AI-Powered Multi-Source Golden Record Generation System
**Overview**

The Entity Resolution Engine is an AI-powered system designed to detect duplicate records across multiple heterogeneous data sources and generate a unified Golden Record with confidence scoring.

The system integrates:

Database records
Uploaded CSV datasets
Multiple external data sources

It uses:

Embedding-based Blocking
Machine Learning Duplicate Detection
Golden Record Generation
Confidence/Matching Score Calculation

This project simulates a real-world Master Data Management (MDM) and Data Deduplication solution used in enterprises.

**Features**

Multi-source data integration
Duplicate detection across datasets
Embedding-based semantic blocking
Random Forest + XGBoost ensemble model
Matching confidence score
Automatic Golden Record generation
CSV + Excel export
SQLite database integration
Generic column detection
Scalable architecture

**Workflow**
Database + Uploaded CSV Files
              ↓
        Data Integration
              ↓
     Embedding-based Blocking
              ↓
      ML Duplicate Detection
              ↓
       Entity Grouping
              ↓
     Golden Record Creation
              ↓
 CSV / Excel / Database Output
 
**Tech Stack**
Category        :Technology
Language        :Python
ML Models       :Random Forest, XGBoost
Embeddings      :Sentence Transformers
Blocking        :Nearest Neighbors
Database        :SQLite
Data Processing :Pandas
Output	        :CSV, Excel
Similarity	    :SequenceMatcher
Model Storage	  :Joblib


**Project Structure**
Resolution_app/
│
├── backend/
│   ├── main.py
│   ├── train_model.py
│   ├── add_to_db.py
│
├── data/
│   ├── restaurants.csv
│   ├── upload.csv
│   ├── database.db
│
├── models/
│   ├── model.pkl
│
├── output/
│   ├── final_golden_record.csv
│   ├── final_golden_record.xlsx
│
├── requirements.txt
│
└── README.md

**Installation**
**Install Dependencies**
pip install pandas scikit-learn xgboost sentence-transformers tabulate openpyxl joblib
**Running the Project**
Step 1 — Train Model
cd backend
python train_model.py

This generates:

models/model.pkl
Step 2 — Run Entity Resolution Pipeline
python main.py

**Output**

The system generates:

output/
   final_golden_record.csv
   final_golden_record.xlsx

It also stores:

Golden records inside SQLite database
Matching confidence scores
ML Pipeline
Blocking

The system uses:

SentenceTransformer + NearestNeighbors

to reduce unnecessary comparisons.

Feature Extraction

Features used:

Name similarity
Address similarity
Phone match
City match
Email match
Duplicate Detection

**Ensemble approach:**

Random Forest
XGBoost

Both models collaboratively determine whether records represent the same entity.

Golden Record Generation

For every duplicate group:

Most reliable/common values are selected
Confidence score is calculated
Unified Golden Record is generated

**Example Output**
Name	Address	City	Matching Score
HDFC Bank Ltd	Mumbai	Mumbai	0.94

**Use Cases**
Master Data Management (MDM)
Customer Data Integration
Healthcare Record Deduplication
Banking KYC Data Cleaning
CRM Data Quality Improvement
Enterprise Data Governance

**Future Enhancements**
FastAPI Backend
Frontend Dashboard
Real-time Streaming Integration
Cloud Database Support
Active Learning Feedback Loop
Graph-based Entity Resolution
Distributed Processing
