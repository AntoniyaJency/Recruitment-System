#!/usr/bin/env python3
"""
Database migration script for the recruitment system.
This script creates the database tables and optionally seeds them with sample data.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db, Job, Company
from datetime import datetime

def create_tables():
    """Create all database tables."""
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("Tables created successfully!")

def seed_data():
    """Seed the database with sample data."""
    with app.app_context():
        print("Seeding database with sample data...")
        
        # Check if data already exists
        if Job.query.count() > 0:
            print("Database already contains data. Skipping seed.")
            return
        
        # Sample companies
        companies = [
            Company(
                name='TechCorp Solutions',
                description='Leading technology company specializing in innovative software solutions and cutting-edge web applications.',
                website='https://techcorp.com',
                location='San Francisco, CA',
                industry='Technology',
                size='Large'
            ),
            Company(
                name='GrowthHub Inc',
                description='Digital marketing agency helping businesses grow their online presence through data-driven strategies.',
                website='https://growthhub.com',
                location='New York, NY',
                industry='Marketing',
                size='Medium'
            ),
            Company(
                name='SalesForce Pro',
                description='Sales consulting firm that helps companies optimize their sales processes and increase revenue.',
                website='https://salesforcepro.com',
                location='Chicago, IL',
                industry='Sales',
                size='Small'
            ),
            Company(
                name='FinanceWise',
                description='Financial consulting firm providing expert advice on investments, budgeting, and financial planning.',
                website='https://financewise.com',
                location='Boston, MA',
                industry='Finance',
                size='Medium'
            ),
            Company(
                name='City Medical Center',
                description='Premier healthcare facility providing comprehensive medical services to the community.',
                website='https://citymedical.org',
                location='Los Angeles, CA',
                industry='Healthcare',
                size='Large'
            )
        ]
        
        for company in companies:
            db.session.add(company)
        
        db.session.commit()
        print(f"Added {len(companies)} companies")
        
        # Sample jobs
        jobs = [
            Job(
                title='Senior Frontend Developer',
                company='TechCorp Solutions',
                location='San Francisco, CA',
                job_type='full-time',
                category='technology',
                salary='$120,000 - $160,000',
                description='We are looking for an experienced Frontend Developer to join our growing team and help build amazing user experiences. You will work with modern technologies including React, TypeScript, and Next.js to create responsive and performant web applications.',
                tags='React,JavaScript,TypeScript,CSS,HTML5,Next.js'
            ),
            Job(
                title='Digital Marketing Manager',
                company='GrowthHub Inc',
                location='New York, NY',
                job_type='full-time',
                category='marketing',
                salary='$80,000 - $100,000',
                description='Join our marketing team to drive digital campaigns and help us reach new heights in customer engagement. You will be responsible for developing and executing comprehensive digital marketing strategies across multiple channels.',
                tags='SEO,SEM,Social Media,Analytics,Google Ads,Content Marketing'
            ),
            Job(
                title='Sales Representative',
                company='SalesForce Pro',
                location='Chicago, IL',
                job_type='remote',
                category='sales',
                salary='$60,000 - $80,000 + Commission',
                description='Looking for motivated sales professionals to help expand our client base and drive revenue growth. This is a remote position with flexible hours and excellent commission structure.',
                tags='B2B Sales,CRM,Negotiation,Communication,Lead Generation'
            ),
            Job(
                title='Financial Analyst',
                company='FinanceWise',
                location='Boston, MA',
                job_type='full-time',
                category='finance',
                salary='$90,000 - $120,000',
                description='Seeking a detail-oriented Financial Analyst to help with financial planning, analysis, and reporting. You will work with senior management to provide insights and recommendations based on financial data.',
                tags='Excel,Financial Modeling,Analysis,Reporting,Forecasting'
            ),
            Job(
                title='Registered Nurse',
                company='City Medical Center',
                location='Los Angeles, CA',
                job_type='part-time',
                category='healthcare',
                salary='$35 - $45 per hour',
                description='Join our healthcare team to provide excellent patient care in a dynamic medical environment. We offer flexible scheduling and competitive compensation.',
                tags='Patient Care,Medical Records,CPR,Nursing,Healthcare'
            ),
            Job(
                title='Backend Developer',
                company='TechCorp Solutions',
                location='Seattle, WA',
                job_type='remote',
                category='technology',
                salary='$110,000 - $140,000',
                description='We need a skilled Backend Developer to build scalable server-side applications and APIs. You will work with Node.js, Python, and cloud technologies to create robust backend systems.',
                tags='Node.js,Python,AWS,MongoDB,PostgreSQL,REST APIs'
            ),
            Job(
                title='Content Marketing Specialist',
                company='GrowthHub Inc',
                location='New York, NY',
                job_type='contract',
                category='marketing',
                salary='$50,000 - $65,000',
                description='Creative Content Marketing Specialist needed to develop engaging content across various platforms. Experience with SEO optimization and social media management required.',
                tags='Content Writing,SEO,Social Media,Blogging,Email Marketing'
            ),
            Job(
                title='Account Executive',
                company='SalesForce Pro',
                location='Chicago, IL',
                job_type='full-time',
                category='sales',
                salary='$70,000 - $90,000 + Commission',
                description='Experienced Account Executive to manage key client relationships and drive new business opportunities. Strong negotiation and communication skills essential.',
                tags='Account Management,Client Relations,Sales Strategy,Negotiation'
            )
        ]
        
        for job in jobs:
            db.session.add(job)
        
        db.session.commit()
        print(f"Added {len(jobs)} jobs")
        
        print("Database seeded successfully!")

def reset_database():
    """Reset the database by dropping all tables and recreating them."""
    with app.app_context():
        print("Resetting database...")
        db.drop_all()
        print("Tables dropped.")
        create_tables()
        seed_data()

if __name__ == '__main__':
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == 'create':
            create_tables()
        elif command == 'seed':
            seed_data()
        elif command == 'reset':
            reset_database()
        else:
            print("Usage: python migrate.py [create|seed|reset]")
    else:
        print("Usage: python migrate.py [create|seed|reset]")
        print("  create - Create database tables")
        print("  seed   - Seed database with sample data")
        print("  reset  - Reset database (drop and recreate)")
