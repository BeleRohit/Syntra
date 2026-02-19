#!/usr/bin/env python3
"""
Syntra Backend API Test Suite
Tests all backend endpoints systematically
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, List, Any

# Backend URL from frontend environment
BACKEND_URL = "https://syntra-brain.preview.emergentagent.com/api"

class SyntraBackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.created_node_ids = []
        self.test_results = {}
        
    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_health_endpoint(self) -> bool:
        """Test GET /api/health endpoint"""
        self.log("Testing health endpoint...")
        try:
            response = self.session.get(f"{self.base_url}/health")
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log("✅ Health endpoint working - backend is healthy")
                    return True
                else:
                    self.log(f"❌ Health endpoint returned unexpected data: {data}")
                    return False
            else:
                self.log(f"❌ Health endpoint failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Health endpoint error: {str(e)}", "ERROR")
            return False
    
    def test_create_node(self, node_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test POST /api/nodes endpoint"""
        self.log(f"Testing create node: {node_data['title']}")
        try:
            response = self.session.post(f"{self.base_url}/nodes", json=node_data)
            
            if response.status_code == 200:
                result = response.json()
                if "node" in result and "id" in result["node"]:
                    node_id = result["node"]["id"]
                    self.created_node_ids.append(node_id)
                    self.log(f"✅ Node created successfully: {node_id}")
                    self.log(f"   - Connections found: {len(result.get('connections', []))}")
                    return result
                else:
                    self.log(f"❌ Create node returned unexpected structure: {result}")
                    return None
            else:
                self.log(f"❌ Create node failed with status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log(f"❌ Create node error: {str(e)}", "ERROR")
            return None
    
    def test_get_all_nodes(self) -> List[Dict[str, Any]]:
        """Test GET /api/nodes endpoint"""
        self.log("Testing get all nodes...")
        try:
            response = self.session.get(f"{self.base_url}/nodes")
            
            if response.status_code == 200:
                nodes = response.json()
                if isinstance(nodes, list):
                    self.log(f"✅ Get all nodes working - returned {len(nodes)} nodes")
                    return nodes
                else:
                    self.log(f"❌ Get all nodes returned non-list: {nodes}")
                    return []
            else:
                self.log(f"❌ Get all nodes failed with status {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            self.log(f"❌ Get all nodes error: {str(e)}", "ERROR")
            return []
    
    def test_get_single_node(self, node_id: str) -> Dict[str, Any]:
        """Test GET /api/nodes/{id} endpoint"""
        self.log(f"Testing get single node: {node_id}")
        try:
            response = self.session.get(f"{self.base_url}/nodes/{node_id}")
            
            if response.status_code == 200:
                result = response.json()
                if "node" in result and "connections" in result:
                    self.log(f"✅ Get single node working - found {len(result['connections'])} connections")
                    return result
                else:
                    self.log(f"❌ Get single node returned unexpected structure: {result}")
                    return None
            elif response.status_code == 404:
                self.log(f"❌ Node not found: {node_id}")
                return None
            else:
                self.log(f"❌ Get single node failed with status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log(f"❌ Get single node error: {str(e)}", "ERROR")
            return None
    
    def test_semantic_search(self, query: str) -> List[Dict[str, Any]]:
        """Test POST /api/search endpoint"""
        self.log(f"Testing semantic search: '{query}'")
        try:
            response = self.session.post(f"{self.base_url}/search", json={"query": query})
            
            if response.status_code == 200:
                results = response.json()
                if isinstance(results, list):
                    self.log(f"✅ Semantic search working - returned {len(results)} results")
                    for i, result in enumerate(results[:3]):  # Show top 3 results
                        similarity = result.get("similarity", 0)
                        title = result.get("node", {}).get("title", "Unknown")
                        self.log(f"   {i+1}. {title} (similarity: {similarity:.3f})")
                    return results
                else:
                    self.log(f"❌ Semantic search returned non-list: {results}")
                    return []
            else:
                self.log(f"❌ Semantic search failed with status {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            self.log(f"❌ Semantic search error: {str(e)}", "ERROR")
            return []
    
    def test_get_graph(self) -> Dict[str, Any]:
        """Test GET /api/graph endpoint"""
        self.log("Testing get graph data...")
        try:
            response = self.session.get(f"{self.base_url}/graph")
            
            if response.status_code == 200:
                graph = response.json()
                if "nodes" in graph and "connections" in graph:
                    nodes_count = len(graph["nodes"])
                    connections_count = len(graph["connections"])
                    self.log(f"✅ Get graph working - {nodes_count} nodes, {connections_count} connections")
                    return graph
                else:
                    self.log(f"❌ Get graph returned unexpected structure: {graph}")
                    return None
            else:
                self.log(f"❌ Get graph failed with status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log(f"❌ Get graph error: {str(e)}", "ERROR")
            return None
    
    def test_delete_node(self, node_id: str) -> bool:
        """Test DELETE /api/nodes/{id} endpoint"""
        self.log(f"Testing delete node: {node_id}")
        try:
            response = self.session.delete(f"{self.base_url}/nodes/{node_id}")
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result and "deleted" in result["message"]:
                    self.log(f"✅ Node deleted successfully: {node_id}")
                    return True
                else:
                    self.log(f"❌ Delete node returned unexpected response: {result}")
                    return False
            elif response.status_code == 404:
                self.log(f"❌ Node not found for deletion: {node_id}")
                return False
            else:
                self.log(f"❌ Delete node failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Delete node error: {str(e)}", "ERROR")
            return False
    
    def run_comprehensive_test(self):
        """Run all tests in sequence with critical scenarios"""
        self.log("="*60)
        self.log("STARTING SYNTRA BACKEND COMPREHENSIVE TEST")
        self.log("="*60)
        
        # Test 1: Health Check
        health_ok = self.test_health_endpoint()
        self.test_results["health"] = health_ok
        
        if not health_ok:
            self.log("❌ CRITICAL: Health endpoint failed - stopping tests")
            return self.test_results
        
        # Test 2: Create similar nodes for connection testing
        philosophy_nodes = [
            {
                "type": "quote",
                "title": "Aristotle on Excellence",
                "content": "Excellence is not an act, but a habit. We are what we repeatedly do. Excellence, then, is not an act but a habit.",
                "source": "Aristotle",
                "tags": ["philosophy", "excellence", "habits"]
            },
            {
                "type": "idea",
                "title": "The Power of Habit Formation",
                "content": "Habits shape our character and determine our destiny. Small daily actions compound into extraordinary results over time.",
                "source": "Personal reflection",
                "tags": ["habits", "personal-growth", "philosophy"]
            },
            {
                "type": "note",
                "title": "Daily Practices and Character",
                "content": "Character is built through consistent daily practices. What we do repeatedly becomes who we are and defines our path in life.",
                "source": "Journal entry",
                "tags": ["character", "daily-practice", "self-improvement"]
            }
        ]
        
        ai_nodes = [
            {
                "type": "article",
                "title": "The Future of Artificial Intelligence",
                "content": "Artificial intelligence is transforming every aspect of human life. Machine learning algorithms can now process vast amounts of data and make predictions with remarkable accuracy.",
                "source": "Tech Journal",
                "tags": ["AI", "machine-learning", "technology"]
            },
            {
                "type": "book",
                "title": "Neural Networks and Deep Learning",
                "content": "Deep neural networks use multiple layers to learn complex patterns from data. They have revolutionized computer vision, natural language processing, and many other fields.",
                "source": "AI Textbook",
                "tags": ["neural-networks", "deep-learning", "AI"]
            }
        ]
        
        created_nodes = []
        
        # Create philosophy nodes (should connect to each other)
        self.log("\n--- Creating Philosophy/Habit Nodes (should auto-connect) ---")
        for node_data in philosophy_nodes:
            result = self.test_create_node(node_data)
            if result:
                created_nodes.append(result)
                # Small delay to ensure proper processing
                time.sleep(0.5)
        
        # Create AI nodes (should connect to each other)
        self.log("\n--- Creating AI/Technology Nodes (should auto-connect) ---")
        for node_data in ai_nodes:
            result = self.test_create_node(node_data)
            if result:
                created_nodes.append(result)
                time.sleep(0.5)
        
        self.test_results["create_nodes"] = len(created_nodes) == 5
        
        # Test 3: Verify connections were created
        self.log("\n--- Verifying Auto-Generated Connections ---")
        connections_found = False
        for node_result in created_nodes:
            if node_result and len(node_result.get("connections", [])) > 0:
                connections_found = True
                node_title = node_result["node"]["title"]
                connection_count = len(node_result["connections"])
                self.log(f"   Node '{node_title}' has {connection_count} connections")
                
                for conn in node_result["connections"]:
                    similarity = conn.get("similarityScore", 0)
                    connected_title = conn.get("node", {}).get("title", "Unknown")
                    self.log(f"     -> Connected to '{connected_title}' (similarity: {similarity:.3f})")
        
        if connections_found:
            self.log("✅ Auto-connections verified successfully")
        else:
            self.log("❌ No auto-connections found - this may indicate an issue")
        
        self.test_results["auto_connections"] = connections_found
        
        # Test 4: Get all nodes
        all_nodes = self.test_get_all_nodes()
        self.test_results["get_all_nodes"] = len(all_nodes) >= 5
        
        # Test 5: Get single node with connections
        if self.created_node_ids:
            node_detail = self.test_get_single_node(self.created_node_ids[0])
            self.test_results["get_single_node"] = node_detail is not None
        else:
            self.test_results["get_single_node"] = False
        
        # Test 6: Semantic search tests
        search_queries = [
            "excellence and habits",
            "artificial intelligence machine learning",
            "character building daily practice"
        ]
        
        self.log("\n--- Testing Semantic Search ---")
        search_working = True
        for query in search_queries:
            results = self.test_semantic_search(query)
            if not results:
                search_working = False
        
        self.test_results["semantic_search"] = search_working
        
        # Test 7: Get graph data
        graph_data = self.test_get_graph()
        self.test_results["get_graph"] = graph_data is not None and len(graph_data.get("nodes", [])) > 0
        
        # Test 8: Delete node (test one node)
        if self.created_node_ids:
            delete_success = self.test_delete_node(self.created_node_ids[-1])
            self.test_results["delete_node"] = delete_success
            if delete_success:
                self.created_node_ids.pop()  # Remove from tracking
        else:
            self.test_results["delete_node"] = False
        
        # Final Summary
        self.log("\n" + "="*60)
        self.log("TEST RESULTS SUMMARY")
        self.log("="*60)
        
        all_passed = True
        for test_name, passed in self.test_results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            self.log(f"{test_name.upper().replace('_', ' ')}: {status}")
            if not passed:
                all_passed = False
        
        self.log("="*60)
        if all_passed:
            self.log("🎉 ALL TESTS PASSED - Backend is working correctly!")
        else:
            self.log("⚠️  SOME TESTS FAILED - Check details above")
        
        self.log(f"Total nodes created during test: {len(self.created_node_ids)}")
        self.log("="*60)
        
        return self.test_results

def main():
    tester = SyntraBackendTester()
    results = tester.run_comprehensive_test()
    
    # Return appropriate exit code
    if all(results.values()):
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Some tests failed

if __name__ == "__main__":
    main()