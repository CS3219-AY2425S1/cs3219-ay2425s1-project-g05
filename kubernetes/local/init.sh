#!/bin/bash
# run the following commands to start the cluster with sufficient compute
minikube start --cpus 3 --memory 6128

# enable addons to expose the ingress
minikube addons enable metrics-server
minikube addons enable ingress

# apply the kubernetes files
# assumes that you are running this script from /kubernetes/local
kubectl apply -f 0-Kubernetes-Secrets.yml
kubectl apply -f 1-PeerPrep-Frontend.yml
kubectl apply -f 2-PeerPrep-User-Service.yml
kubectl apply -f 3-PeerPrep-Question-Service.yml
kubectl apply -f 4-PeerPrep-Matching-Service.yml
kubectl apply -f 5-PeerPrep-Collaboration-Service.yml
kubectl apply -f 6-PeerPrep-Communication-Service.yml
kubectl apply -f 7-PeerPrep-Ingress.yml

# open up the minikube dashboard if needed
# minikube dashboard --url

# open up a tunnel to enable access to the ingress resource
minikube tunnel
