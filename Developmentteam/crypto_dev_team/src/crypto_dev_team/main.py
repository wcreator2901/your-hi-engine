#!/usr/bin/env python
import sys
import warnings

from crypto_dev_team.crew import CryptoDevTeam

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

def run():
    """
    Run the crew with a user request.
    """
    # Get user request
    if len(sys.argv) > 1:
        user_request = " ".join(sys.argv[1:])
    else:
        print("\n" + "="*60)
        print("🤖 CRYPTO DEV TEAM - Manager + 6 Specialists")
        print("="*60)
        print("\n👥 Your Team:")
        print("  • Project Manager (coordinates everything)")
        print("  • Code Analyzer (finds bugs & issues)")
        print("  • Code Implementer (builds features & fixes)")
        print("  • Database Architect (schemas, migrations, APIs)")
        print("  • Security Specialist (crypto wallet security)")
        print("  • QA Tester (writes tests & ensures quality)")
        print("  • UI Designer (builds beautiful components)")
        print("\n" + "="*60)
        print("\nWhat would you like the team to work on?")
        print("\n✅ GOOD Examples:")
        print("  • Find bugs in the wallet balance fetching logic")
        print("  • Create database schema for transaction history")
        print("  • Review security of private key handling in hdWallet.ts")
        print("  • Write tests for the send transaction flow")
        print("  • Build a responsive transaction history UI component")
        print("  • Fix the issue where deposits aren't showing up")
        print("  • Implement Supabase RLS policies for user wallets")
        print("\n❌ BAD Examples (too vague):")
        print("  • Run full debugging")
        print("  • Check everything")
        print("  • Make it better")
        print("\n💡 Tip: Be specific about WHAT and WHERE")
        print("\nYour request:")
        user_request = input("> ").strip()
    
    if not user_request:
        print("❌ No request provided. Exiting.")
        return
    
    print(f"\n📋 Request: {user_request}")
    print("\n🚀 Manager is assembling the team...")
    print("="*60 + "\n")
    
    inputs = {
        'user_request': user_request
    }
    
    try:
        result = CryptoDevTeam().crew().kickoff(inputs=inputs)
        
        print("\n" + "="*60)
        print("✅ WORK COMPLETED")
        print("="*60)
        print("\n📊 Final Report:\n")
        print(result)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Process interrupted by user")
        print("💡 Tip: Use more specific requests to reduce execution time")
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
        print("\n💡 Try a more specific request or check your API key")
        raise

def train():
    """
    Train the crew for a given number of iterations.
    """
    inputs = {
        "user_request": "Analyze the wallet balance fetching code for bugs"
    }
    try:
        CryptoDevTeam().crew().train(
            n_iterations=int(sys.argv[1]) if len(sys.argv) > 1 else 1,
            filename=sys.argv[2] if len(sys.argv) > 2 else None,
            inputs=inputs
        )

    except Exception as e:
        raise Exception(f"An error occurred while training the crew: {e}")

def replay():
    """
    Replay the crew execution from a specific task.
    """
    try:
        CryptoDevTeam().crew().replay(task_id=sys.argv[1])

    except Exception as e:
        raise Exception(f"An error occurred while replaying the crew: {e}")

def test():
    """
    Test the crew execution and returns the results.
    """
    inputs = {
        "user_request": "Analyze the authentication system for security issues"
    }
    try:
        CryptoDevTeam().crew().test(
            n_iterations=int(sys.argv[1]) if len(sys.argv) > 1 else 1,
            openai_model_name=sys.argv[2] if len(sys.argv) > 2 else None,
            inputs=inputs
        )

    except Exception as e:
        raise Exception(f"An error occurred while testing the crew: {e}")


if __name__ == "__main__":
    run()