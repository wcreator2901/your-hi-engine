from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from crewai_tools import FileReadTool, DirectoryReadTool, FileWriterTool, CodeInterpreterTool
from typing import List
import os

@CrewBase
class CryptoDevTeam():
    """CryptoDevTeam crew - Manager + 6 Specialists (Full Configuration)"""

    agents: List[BaseAgent]
    tasks: List[Task]

    # Define the path to your crypto wallet project
    project_path = "C:/Users/User/Desktop/Cursor/your-hi-engine"

    # Initialize Claude LLM
    claude_llm = LLM(
        model="anthropic/claude-sonnet-3-5-20241022",
        temperature=0.1
    )
    
    # Initialize tools
    file_read_tool = FileReadTool()
    directory_read_tool = DirectoryReadTool(directory=project_path)
    file_writer_tool = FileWriterTool()
    code_interpreter_tool = CodeInterpreterTool()

    # ===== MANAGER AGENT =====
    @agent
    def project_manager(self) -> Agent:
        return Agent(
            config=self.agents_config['project_manager'],
            tools=[self.file_read_tool, self.directory_read_tool],
            llm=self.claude_llm,
            verbose=True,
            allow_delegation=True,  # Manager can delegate
            max_iter=15  # Limit iterations to control costs
        )

    # ===== SPECIALIST AGENTS =====
    @agent
    def code_analyzer(self) -> Agent:
        return Agent(
            config=self.agents_config['code_analyzer'],
            tools=[self.file_read_tool, self.directory_read_tool],
            llm=self.claude_llm,
            verbose=True,
            allow_delegation=False,
            max_iter=10
        )

    @agent
    def code_implementer(self) -> Agent:
        return Agent(
            config=self.agents_config['code_implementer'],
            tools=[self.file_read_tool, self.directory_read_tool, self.file_writer_tool, self.code_interpreter_tool],
            llm=self.claude_llm,
            verbose=True,
            allow_delegation=False,
            max_iter=10
        )

    @agent
    def security_specialist(self) -> Agent:
        return Agent(
            config=self.agents_config['security_specialist'],
            tools=[self.file_read_tool, self.directory_read_tool],
            llm=self.claude_llm,
            verbose=True,
            allow_delegation=False,
            max_iter=8
        )

    @agent
    def database_architect(self) -> Agent:
        return Agent(
            config=self.agents_config['database_architect'],
            tools=[self.file_read_tool, self.directory_read_tool, self.file_writer_tool],
            llm=self.claude_llm,
            verbose=True,
            allow_delegation=False,
            max_iter=10
        )

    @agent
    def qa_tester(self) -> Agent:
        return Agent(
            config=self.agents_config['qa_tester'],
            tools=[self.file_read_tool, self.directory_read_tool, self.file_writer_tool, self.code_interpreter_tool],
            llm=self.claude_llm,
            verbose=True,
            allow_delegation=False,
            max_iter=8
        )

    @agent
    def ui_designer(self) -> Agent:
        return Agent(
            config=self.agents_config['ui_designer'],
            tools=[self.file_read_tool, self.directory_read_tool, self.file_writer_tool],
            llm=self.claude_llm,
            verbose=True,
            allow_delegation=False,
            max_iter=10
        )

    # ===== SINGLE TASK FOR MANAGER =====
    @task
    def manage_user_request(self) -> Task:
        return Task(
            config=self.tasks_config['manage_user_request'],
            agent=self.project_manager()
        )

    # ===== CREW WITH HIERARCHICAL PROCESS =====
    @crew
    def crew(self) -> Crew:
        """Creates the CryptoDevTeam crew with manager + 6 specialists"""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.hierarchical,
            manager_llm=self.claude_llm,
            verbose=True,
        )