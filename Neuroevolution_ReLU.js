//Project: AsteroidsLearning7_ReLU
//File: Neuroevolution_ReLU.js
//This version of Neuroevolution class uses ReLU activation instead of the sigmoidal activation function.

var neuroevolutionStaticCounter = 0.436; //seed //note this is a different variable than game.js's staticCounter
neuroevolutionCustomRandom = function() {
	neuroevolutionStaticCounter += 0.3974;
	
	var result = neuroevolutionStaticCounter % 1; //modulus
	//console.log(name, "neuroevolutionStaticCounter is ", neuroevolutionStaticCounter, ". neuroevolutionCustomRandom() result is ", result);
	return Math.random(); //result;
};

var Neuroevolution_ReLU = function(options){
	var self = this;
	self.options = {
		activation:function(graph_x){ //Note: I changed the parameter from "a" to "graph_x"
			return Math.max(0, graph_x); //This is the standard ReLU activation function.
		},
		randomClamped:function(){
		  //aug2//console.log("calling neuroevolutionCustomRandom() in randomClamped");
			return neuroevolutionCustomRandom() * 2 - 1;
		},
		population:50,
		elitism:0.2,
		randomBehaviour:0.2,
		mutationRate:0.1,
		mutationRange:0.5,
		network:[1, [1], 1],
		historic:0,
		lowHistoric:false,
		scoreSort:-1,
		nbChild:1,
		name:"idk" //neuvol or neuvol2
	};

	/*
	self.set = function(options){
		for(var i in options){
			if(this.options[i] !== undefined){
				self.options[i] = options[i];
			}
		}
	};
	*/

	//edited by ZW
    self.set = function(options){
        for(var i in options){
            if(options[i] !== undefined){
                self.options[i] = options[i];
            }
        }
    };

	self.set(options);

	//NEURON
	var Neuron = function(){
		this.value = 0;
		this.weights = [];
	};
	Neuron.prototype.populate = function(nb){
		this.weights = [];
		for(var i = 0; i < nb; i++){
			this.weights.push(self.options.randomClamped());
		}
	};
	//LAYER
	var Layer = function(index){
		this.id = index;// || 0;
		this.neurons = [];
	};
	Layer.prototype.populate = function(nbNeurons, nbInputs){
		this.neurons = [];
		for(var i = 0; i < nbNeurons; i++){
			var n = new Neuron();
			//console.log("n.value is ", n.value);
			n.populate(nbInputs);
			//console.log("after populating n, n.value is ", n.value);
			//console.log("n is ", n);
			//console.log("n.value is ", n.value);
			this.neurons.push(n);
		}
		//jun5//console.log("this.neurons is ", this.neurons);
	};
	
	//NETWORK
	var Network = function(){
		this.layers = [];
	};

	Network.prototype.perceptronGeneration = function(input, hiddens, output){
		var index = 0;
		var previousNeurons = 0;
		var layer = new Layer(index);
		layer.populate(input, previousNeurons);
		previousNeurons = input;
		this.layers.push(layer);
		index++;
		for(var i in hiddens){
			var layerHidden = new Layer(index);
			layerHidden.populate(hiddens[i], previousNeurons);
			previousNeurons = hiddens[i];
			this.layers.push(layerHidden);
			index++;
		}
		var layerOutput = new Layer(index);
		layerOutput.populate(output, previousNeurons);
		this.layers.push(layerOutput);
	};


	Network.prototype.getSave = function(){
		var datas = {
			neurons:[],
			weights:[]
		};
		for(var i in this.layers){
			datas.neurons.push(this.layers[i].neurons.length);
			for(var j in this.layers[i].neurons){
				for(var k in this.layers[i].neurons[j].weights){
					datas.weights.push(this.layers[i].neurons[j].weights[k]);
				}
			}
		}
		return datas;
	};


	Network.prototype.setSave = function(save){
		var previousNeurons = 0;
		var index = 0;
		var indexWeights = 0;
		
		//jun5//console.log("this.layers is " + this.layers);
		this.layers = [];
		for(var i in save.neurons){
			var layer = new Layer(index);
			
			//console.log("before layer.populate, layer is ", layer);
			//console.log("layer.neurons is ", layer.neurons);
			//console.log("layer.neurons[0] is ", layer.neurons[0]);
			
			//jun5//console.log("previousNeurons is ", previousNeurons);
			layer.populate(save.neurons[i], previousNeurons);
			//jun5//console.log("after layer.populate, layer.neurons[0] is ", layer.neurons[0]);
			//jun5//console.log("after layer.populate, layer.neurons[0].value is ", layer.neurons[0].value);
			//jun5//console.log("after layer.populate, layer.neurons[0].weights[0] is ", layer.neurons[0].weights[0]);
			//console.log("after layer.populate, this.layers is " + this.layers);
			//console.log("after layer.populate, layer is ", layer);
			/*
			for(var iLayer in this.layers) {
				console.log(this.layers[iLayer]);
				
				System.out.println("\t this.layers[i].id is " + this.layers[i].id);
				System.out.println("\t this.layers[i].neurons is " + this.layers[i].neurons);
				for(int iNeuron = 0; iNeuron < this.layers[i].neurons.length; iNeuron++) {
					System.out.println("\t\t this.layers[i].neurons[iNeuron which is " + iNeuron + "] is "
						+ this.layers[i].neurons[iNeuron]);
					System.out.println("\t\t\t this.layers[i].neurons[iNeuron].value is "
						+ this.layers[i].neurons[iNeuron].value);
				}
				
			
				//System.out.println();
			}
			console.log("end this.layers");
			*/
		
			for(var j in layer.neurons){
				for(var k in layer.neurons[j].weights){
					layer.neurons[j].weights[k] = save.weights[indexWeights];
					indexWeights++;
				}
			}
			previousNeurons = save.neurons[i];
			index++;
			this.layers.push(layer);
		}
		//jun5//console.log("this.layers is " + this.layers);
	};

	Network.prototype.compute = function(inputs, shouldPrint){
		for(var i in inputs){
			if(this.layers[0] && this.layers[0].neurons[i]){
				this.layers[0].neurons[i].value = inputs[i];
			} else {
			  alert("what");
			}
		}

		var prevLayer = this.layers[0];
		
		if(shouldPrint) {
		  //aug11//console.log("this.layers[1].neurons[0].weights[0] is "
			//aug11//	+ this.layers[1].neurons[0].weights[0]);  
		}
		
		for(var i2 = 1; i2 < this.layers.length; i2++){
			for(var j in this.layers[i2].neurons){
				var sum = 0;
				for(var k in prevLayer.neurons){
					sum += prevLayer.neurons[k].value * this.layers[i2].neurons[j].weights[k];
				}
				this.layers[i2].neurons[j].value = self.options.activation(sum);
			}
			prevLayer = this.layers[i2];
		}

		var out = [];
		var lastLayer = this.layers[this.layers.length - 1];
		for(var i3 in lastLayer.neurons){
			out.push(lastLayer.neurons[i3].value);
		}
		return out;
	};
	//GENOM
	var Genome = function(score, network){
		this.score = score || 0;
		this.network = network || null;
	};
	//GENERATION
	var Generation = function(){
		this.genomes = [];
	};

	Generation.prototype.addGenome = function(genome){
		for(var i = 0; i < this.genomes.length; i++){
			if(self.options.scoreSort < 0){
				if(genome.score > this.genomes[i].score){
					break;
				}
			}else{
				if(genome.score < this.genomes[i].score){
					break;
				}
			}

		}
		this.genomes.splice(i, 0, genome);
		
		//aug2//console.log("Neuroevolution.js: this.genomes is " + this.genomes);
		//aug2//for(var iGenome = 0; iGenome < this.genomes.length; iGenome++) {
		//aug2//	console.log("this.genomes[iGenome].network.weights[0] is "
					//aug2//+ this.genomes[iGenome].network.weights[0]);
		//aug2//}
	};

	Generation.prototype.breed = function(g1, g2, nbChilds){
		var datas = [];
		for(var nb = 0; nb < nbChilds; nb++){
			var data = JSON.parse(JSON.stringify(g1));
			
			//jun5_11//console.log("g2.network.weights[0] is ", g2.network.weights[0]);
			for(var i in g2.network.weights){
				if(neuroevolutionCustomRandom() <= 0.5){
				  //jun5_11//console.log("g2.network.weights[i] is ", g2.network.weights[i]);
					data.network.weights[i] = g2.network.weights[i];
				}
			}

			for(var i2 in data.network.weights){
				if(neuroevolutionCustomRandom() <= self.options.mutationRate){
					data.network.weights[i2] += neuroevolutionCustomRandom() * self.options.mutationRange * 2 - self.options.mutationRange;
				}
			}
			datas.push(data);
		}

		return datas;
	};

	Generation.prototype.generateNextGeneration = function(){
		var nexts = [];

		for(var i = 0; i < Math.round(self.options.elitism * self.options.population); i++){
			if(nexts.length < self.options.population){
			  //aug11//console.log("this.genomes[i].network.weights[0] is ", this.genomes[i].network.weights[0]); //yyy
				nexts.push(JSON.parse(JSON.stringify(this.genomes[i].network)));
				/*
				if(i === 0) {
				  console.log(this.genomes[i].network);
				}
				*/
			}
		}
		
		//aug11//console.log("nexts is ", nexts);
		//aug11//for(var iNext in nexts) {
		  //aug11//console.log("nexts[iNext] is ", nexts[iNext]);
		  //aug11//console.log("nexts[iNext].weights[0] is ", nexts[iNext].weights[0]);
		//aug11//}
		//aug11//console.log("end nexts");

		for(var iMutant = 0; iMutant < Math.round(self.options.randomBehaviour * self.options.population); iMutant++){
			var n = JSON.parse(JSON.stringify(this.genomes[0].network));
			for(var k in n.weights){
				n.weights[k] = self.options.randomClamped();
			}
			if(nexts.length < self.options.population){
				nexts.push(n);
			}
		}

		var max = 0;
		while(true){
			for(var i3 = 0; i3 < max; i3++){
				var childs = this.breed(this.genomes[i3], this.genomes[max], (self.options.nbChild > 0 ? self.options.nbChild : 1) );
				for(var c in childs){
					nexts.push(childs[c].network);
					if(nexts.length >= self.options.population){
						return nexts;
					}
				}
			}
			max++;
			if(max >= this.genomes.length - 1){
				max = 0;
			}
		}
	};
	//GENERATIONS
	var Generations = function(){
		this.generations = [];
		var currentGeneration = new Generation();
	};

	Generations.prototype.firstGeneration = function(input, hiddens, output){
		var out = [];
		for(var i = 0; i < self.options.population; i++){
			var nn = new Network();
			nn.perceptronGeneration(self.options.network[0], self.options.network[1], self.options.network[2]);
			out.push(nn.getSave());
		}
		this.generations.push(new Generation());
		return out;
	};

	Generations.prototype.nextGeneration = function(){
		if(this.generations.length === 0){
			return false;
		}

		var gen = this.generations[this.generations.length - 1].generateNextGeneration();
		this.generations.push(new Generation());
		return gen;
	};


	Generations.prototype.addGenome = function(genome){
		if(this.generations.length === 0){
			return false;
		}

		var myCurrentGeneration = this.generations[this.generations.length - 1];
		var result = myCurrentGeneration.addGenome(genome);
		
		//jun5//console.log("in addGenome: " ,
		//jun5//			myCurrentGeneration.genomes[myCurrentGeneration.genomes.length-1].network.weights[0]
			//jun5//);
			
		return result;
	};


	//SELF METHODS
	self.generations = new Generations();

	/*
	self.restart = function(){
		self.generations = new Generations();
	};
	*/

	self.nextGeneration = function(){
		var networks = [];
		if(self.generations.generations.length === 0){
			//aug11//console.log("self.generations.generations.length === 0)");
			networks = self.generations.firstGeneration();
		}else{
			networks = self.generations.nextGeneration();
		}
		var nns = [];
		for(var i in networks){
			var nn = new Network();
			var aSave = networks[i];
			//jun5//
			//aug11//console.log("aSave.weights[0] is ", aSave.weights[0]);
			nn.setSave(aSave);  
			nns.push(nn);
		}

		if(self.options.lowHistoric){
			if(self.generations.generations.length >= 2){
				var genomes = self.generations.generations[self.generations.generations.length  - 2].genomes;
				for(var i2 in genomes){
					delete genomes[i2].network;
				}
			}
		}

		if(self.options.historic != -1){
			//aug11//console.log("self.options.historic != -1");
			if(self.generations.generations.length > self.options.historic + 1){
				//aug11//console.log("self.generations.generations.length > self.options.historic + 1");
				
				//aug11//console.log("before splice, before splice, self.generations.generations: ", 
				  //aug11//self.generations.generations);
				//aug11//for(var iGeneration in self.generations.generations) {
				  //aug11//console.log(self.generations.generations[iGeneration]);
				//aug11//}
				//alert("before splice, self.generations.generations: " + self.generations.generations);
				self.generations.generations.splice(0, self.generations.generations.length - (self.options.historic + 1));
				
				//aug11//console.log("after splice, self.generations.generations: ", 
				//aug11//  self.generations.generations);
				//aug11//for(var iGeneration in self.generations.generations) {
				  //aug11//console.log(self.generations.generations[iGeneration]);
				//aug11//}
				
				//aug2//alert("Neurovolution.js");
			}
		}
		
		//jun5//console.log("nns is ", nns);
		return nns;
	};

  	//network will be something like gen[i]
	self.networkScore = function(network, score, print){
		self.generations.addGenome(new Genome(score, network.getSave()));
		if(print === true){
		  //44//
		  //jun5//console.log(network.getSave().weights[0]);  
		}
	};
};