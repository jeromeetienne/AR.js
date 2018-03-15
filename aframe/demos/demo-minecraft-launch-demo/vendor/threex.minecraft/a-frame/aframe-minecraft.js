//////////////////////////////////////////////////////////////////////////////
//                Code Separator
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerPrimitive('a-minecraft', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
        defaultComponents: {
                minecraft: {},
                'minecraft-head-anim': 'still',
                'minecraft-body-anim': 'stand',
                'minecraft-nickname': 'John',
                'minecraft-bubble': '',
                'minecraft-controls': {},
        },
        mappings: {
                'head-anim': 'minecraft-head-anim',
                'body-anim': 'minecraft-body-anim',
                'nickname': 'minecraft-nickname',
                'bubble': 'minecraft-bubble',
                'controls': 'minecraft-controls',
        }
}));

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerComponent('minecraft', {
	schema: {
		skinUrl: {
			type: 'string',
			default : ''
		},
		wellKnownSkin: {
			type: 'string',
			default : ''
		},
		heightMeter : {
			default : 1.6
		}
	},
	init: function () {
		var character	= new THREEx.MinecraftChar()
		this.character = character

		this.el.object3D.add( character.root )
		// this.el.setObject3D('superRoot', character.root);
	},
	update: function () {
                if( Object.keys(this.data).length === 0 )       return
		var character = this.character
		character.root.scale.set(1,1,1).multiplyScalar(this.data.heightMeter)
		
		if( this.data.skinUrl ){
			character.loadSkin(this.data.skinUrl)
		}else if( this.data.wellKnownSkin ){
			character.loadWellKnownSkin(this.data.wellKnownSkin)
		}
	},
});


//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
AFRAME.registerComponent('minecraft-head-anim', {
	schema: {
		type: 'string',
		default : 'yes',
	},
	init: function () {
		var character = this.el.components.minecraft.character
		this.headAnims	= new THREEx.MinecraftCharHeadAnimations(character);
	},
	tick : function(now, delta){
		this.headAnims.update(delta/1000,now/1000)
	},
	update: function () {
                if( Object.keys(this.data).length === 0 )       return
		console.assert( this.headAnims.names().indexOf(this.data) !== -1 )
		this.headAnims.start(this.data);			
	},
});

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerComponent('minecraft-body-anim', {
	schema: {
		type: 'string',
		default : 'wave',
	},
	init: function () {
		var character = this.el.components.minecraft.character
		this.bodyAnims	= new THREEx.MinecraftCharBodyAnimations(character);
	},
	tick : function(now, delta){
                // force the animation according to controls
                var minecraftControls = this.el.components['minecraft-controls']
                if( minecraftControls ){
                        var input = minecraftControls.controls.input
                        if( input.up || input.down ){
                                this.bodyAnims.start('run');			
                        }else if( input.strafeLeft || input.strafeRight ){
                                this.bodyAnims.start('strafe');
                        }else {
                                this.bodyAnims.start('stand');			
                        }        
                }
                // update the animation
		this.bodyAnims.update(delta/1000,now/1000)
	},
	update: function () {
                if( Object.keys(this.data).length === 0 )       return
		console.assert( this.bodyAnims.names().indexOf(this.data) !== -1 )
		this.bodyAnims.start(this.data);
	},
});


//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerComponent('minecraft-nickname', {
	schema: {
		type: 'string',
		default : 'Joe',
	},
	init: function () {
		var character = this.el.components.minecraft.character
		this.nickName	= new THREEx.MinecraftNickname(character);
	},
	update: function () {
                if( Object.keys(this.data).length === 0 )       return
		this.nickName.set(this.data);
	},
});

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerComponent('minecraft-bubble', {
	schema: {
		type: 'string',
		default : 'Hello world.',
	},
	init: function () {
		var character = this.el.components.minecraft.character
		this.bubble	= new THREEx.MinecraftBubble(character);
	},
        update: function () {
                if( Object.keys(this.data).length === 0 )       return
		this.bubble.set(this.data);
	},
        tick : function(now, delta){
                this.bubble.update(delta/1000,now/1000)
	},
});


//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerComponent('minecraft-controls', {
	schema: {
	},
	init: function () {
		var character = this.el.components.minecraft.character
		this.controls	= new THREEx.MinecraftControls(character)
                THREEx.MinecraftControls.setKeyboardInput(this.controls, ['wasd', 'arrows', 'ijkl'])
	},
        tick : function(now, delta){
                this.controls.update(delta/1000,now/1000)
	},
});
