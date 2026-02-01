#!/usr/bin/env python3
"""
Test script to verify application submission works
"""

import requests
import json

# Test application submission
def test_application_submission():
    print("🧪 Testing Application Submission")
    print("=" * 40)
    
    # First get available jobs
    try:
        response = requests.get("http://localhost:5001/api/jobs")
        if response.status_code != 200:
            print("❌ Failed to get jobs")
            return
        
        jobs = response.json()['jobs']
        if not jobs:
            print("❌ No jobs available")
            return
        
        job_id = jobs[0]['id']
        job_title = jobs[0]['title']
        print(f"✅ Found job: {job_title} (ID: {job_id})")
        
        # Test application submission with JSON
        application_data = {
            "job_id": job_id,
            "applicant_name": "Test User",
            "applicant_email": "test@example.com",
            "applicant_phone": "555-1234",
            "cover_letter": "This is a test application.",
            "resume_filename": "test_resume.pdf"
        }
        
        response = requests.post(
            "http://localhost:5001/api/applications",
            json=application_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Application submission status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Application submitted successfully!")
            print(f"   Application ID: {result['id']}")
            print(f"   Applicant: {result['applicant_name']}")
            print(f"   Job: {result['job_title']}")
            print(f"   Status: {result['status']}")
        else:
            print(f"❌ Application submission failed: {response.text}")
        
        # Check applications in database
        response = requests.get("http://localhost:5001/api/applications")
        if response.status_code == 200:
            applications = response.json()['applications']
            print(f"\n📊 Total applications in database: {len(applications)}")
            
            if applications:
                latest = applications[0]
                print(f"   Latest: {latest['applicant_name']} -> {latest['job_title']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_application_submission()
